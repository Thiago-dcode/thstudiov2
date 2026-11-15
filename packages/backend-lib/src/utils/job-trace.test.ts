const mockLoggers: Record<string, Record<string, jest.Mock>> = {};
jest.mock('../services/log-service/factory-log.service', () => ({
  FactoryLogService: {
    createLogService: (_type: string, cfg: { channel: string }) => {
      mockLoggers[cfg.channel] ??= {
        info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), critical: jest.fn(),
      };
      return mockLoggers[cfg.channel];
    },
  },
}));

import { JOB_ERROR_500_MAIL, JOB_FLUSH_LOGS } from '@repo/common-lib/constants/queues';
import { LogService } from '../services/log-service/log.service';
import { getLogContext, runWithLogContext } from '../services/log-service/log-context';
import {
  enqueueJob,
  enqueueJobs,
  logPermanentJobFailure,
  readJobTrace,
  runJobWithLogContext,
  withJobTrace,
} from './job-trace';

const carrier = (id: unknown, c?: unknown, v: unknown = 1) => JSON.stringify({ v, id, c });
const queueLog = () => mockLoggers['queue'];
const failedLog = () => mockLoggers['failed-job'];

const job = (over: Record<string, unknown> = {}): any => ({
  id: '1',
  name: 'n',
  queueName: 'q',
  attemptsMade: 0,
  opts: { attempts: 3, telemetry: { metadata: carrier('R', { user_id: 7 }) } },
  ...over,
});

beforeEach(() => {
  for (const channel of Object.values(mockLoggers)) Object.values(channel).forEach((fn) => fn.mockReset());
  jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

// Make sure the module-level loggers exist before the first assertion.
beforeAll(() => {
  void enqueueJob;
});

describe('withJobTrace', () => {
  it('AC-8: carries id and correlation minus job-scoped keys, plus parent_job_id', () => {
    runWithLogContext(
      { id: 'R', correlation: { user_id: 1, job_id: 'p', queue: 'x', attempt: 2, job_name: 'jn' } },
      () => {
        const opts = withJobTrace({ attempts: 3 });
        expect(opts.attempts).toBe(3);
        expect(JSON.parse(opts.telemetry!.metadata as string)).toEqual({ v: 1, id: 'R', c: { user_id: 1, parent_job_id: 'p' } });
      },
    );
  });

  it('AC-8: outside a context the opts have no telemetry key', () => {
    const opts = withJobTrace({ attempts: 3 });
    expect('telemetry' in opts).toBe(false);
    expect('telemetry' in withJobTrace()).toBe(false);
  });

  it('AC-8: an explicit telemetry is returned untouched', () => {
    runWithLogContext({ id: 'R' }, () => {
      const given = { telemetry: { metadata: 'mine' } };
      expect(withJobTrace(given)).toBe(given);
    });
  });

  it('AC-8: a carrier over 2048 chars drops c but keeps the id', () => {
    runWithLogContext({ id: 'R', correlation: { stripe_event_type: 'x'.repeat(3000) } }, () => {
      const parsed = JSON.parse(withJobTrace().telemetry!.metadata as string);
      expect(parsed).toEqual({ v: 1, id: 'R' });
    });
  });
});

describe('readJobTrace', () => {
  it('AC-9: round-trips withJobTrace', () => {
    runWithLogContext({ id: 'R', correlation: { user_id: 1, job_id: 'p' } }, () => {
      const opts = withJobTrace();
      expect(readJobTrace({ opts } as any)).toEqual({ id: 'R', correlation: { user_id: 1, parent_job_id: 'p' } });
    });
  });

  it.each([
    ['missing opts', undefined],
    ['no telemetry', {}],
    ['non-JSON', { telemetry: { metadata: '{nope' } }],
    ['v:2', { telemetry: { metadata: carrier('R', {}, 2) } }],
    ['numeric id', { telemetry: { metadata: carrier(5) } }],
    ['129-char id', { telemetry: { metadata: carrier('x'.repeat(129)) } }],
    ['non-string metadata', { telemetry: { metadata: 12 } }],
  ])('AC-9: %s gives null without throwing', (_n, opts) => {
    expect(readJobTrace({ opts } as any)).toBeNull();
    expect(readJobTrace(undefined)).toBeNull();
  });

  it('AC-9: strips unknown and wrongly typed c keys', () => {
    const opts = { telemetry: { metadata: carrier('R', { user_id: '5', media_id: 3, evil: 'x', stripe_customer_id: 9, cron: 'c' }) } };
    expect(readJobTrace({ opts } as any)).toEqual({ id: 'R', correlation: { media_id: 3, cron: 'c' } });
  });

  it('AC-9: a 128-char id is accepted', () => {
    const opts = { telemetry: { metadata: carrier('x'.repeat(128)) } };
    expect(readJobTrace({ opts } as any)?.id).toHaveLength(128);
  });
});

describe('enqueueJob / enqueueJobs', () => {
  const makeQueue = () => ({
    name: 'mail',
    add: jest.fn().mockResolvedValue({ id: 'job-9' }),
    addBulk: jest.fn().mockResolvedValue([]),
  });

  it('AC-10: passes the identical data reference and traced opts; one enqueue line', async () => {
    const queue = makeQueue();
    const data = { a: 1 };
    await runWithLogContext({ id: 'R' }, () => enqueueJob(queue as any, 'some-job', data, { delay: 500, attempts: 2 }));
    const [name, passed, opts] = queue.add.mock.calls[0];
    expect(name).toBe('some-job');
    expect(passed).toBe(data);
    expect(opts.attempts).toBe(2);
    expect(JSON.parse(opts.telemetry.metadata).id).toBe('R');
    expect(queueLog().info).toHaveBeenCalledTimes(1);
    const [message, extra, fields] = queueLog().info.mock.calls[0];
    expect(message).toBe('Job enqueued');
    expect(extra).toEqual({ delay_ms: 500 });
    expect(fields).toEqual({ operation: 'enqueue', correlation: { queue: 'mail', job_name: 'some-job', job_id: 'job-9' } });
  });

  it.each([JOB_ERROR_500_MAIL, JOB_FLUSH_LOGS])('AC-10: no line for %s, but the carrier is attached', async (name) => {
    const queue = makeQueue();
    await runWithLogContext({ id: 'R' }, () => enqueueJob(queue as any, name, {}));
    expect(JSON.parse(queue.add.mock.calls[0][2].telemetry.metadata).id).toBe('R');
    expect(queueLog()?.info ?? { mock: { calls: [] } }).toHaveProperty('mock.calls', []);
  });

  it('AC-10: a rejecting add logs one error and rethrows', async () => {
    const queue = makeQueue();
    queue.add.mockRejectedValue(new Error('redis down'));
    await expect(enqueueJob(queue as any, 'j', {})).rejects.toThrow('redis down');
    expect(queueLog().error).toHaveBeenCalledTimes(1);
    expect(queueLog().error.mock.calls[0][0]).toBe('Job enqueue failed');
    expect(queueLog().info).not.toHaveBeenCalled();
  });

  it('AC-10: enqueueJobs traces every job and writes one summary line', async () => {
    const queue = makeQueue();
    await runWithLogContext({ id: 'R' }, () =>
      enqueueJobs(queue as any, [
        { name: 'a', data: 1 },
        { name: 'a', data: 2 },
        { name: 'b', data: 3, opts: { attempts: 2 } },
      ]),
    );
    const sent = queue.addBulk.mock.calls[0][0];
    expect(sent).toHaveLength(3);
    for (const j of sent) expect(JSON.parse(j.opts.telemetry.metadata).id).toBe('R');
    expect(sent[2].opts.attempts).toBe(2);
    expect(queueLog().info).toHaveBeenCalledTimes(1);
    expect(queueLog().info.mock.calls[0][0]).toBe('Jobs enqueued');
    expect(queueLog().info.mock.calls[0][1]).toEqual({ job_names: ['a', 'b'], count: 3 });
  });
});

describe('runJobWithLogContext', () => {
  it('AC-12: runs fn in the carrier context with job correlation', async () => {
    let seen: any;
    await runJobWithLogContext(job(), () => {
      seen = getLogContext();
    });
    expect(seen.id).toBe('R');
    expect(seen.correlation).toEqual({ user_id: 7, job_id: '1', job_name: 'n', queue: 'q', attempt: 1 });
  });

  it('AC-12: a job without a carrier gets id null; a fake job without opts/queueName still works', async () => {
    let seen: any;
    await runJobWithLogContext({ id: '2', name: 'x', attemptsMade: 0 } as any, () => {
      seen = getLogContext();
    });
    expect(seen.id).toBeNull();
    expect(seen.correlation.queue).toBe('unknown');
  });

  it('AC-12: success gives started then completed with a numeric duration; flush called once', async () => {
    const result = await runJobWithLogContext(job(), async () => 'ok');
    expect(result).toBe('ok');
    const calls = queueLog().info.mock.calls;
    expect(calls.map((c: any[]) => c[0])).toEqual(['Job started', 'Job completed']);
    expect(typeof calls[1][1].duration_ms).toBe('number');
    expect(calls[0][2]).toEqual({ operation: 'job' });
    expect(LogService.flush).toHaveBeenCalledTimes(1);
  });

  it('AC-12: a throw on attempt 1/3 logs warn "Job attempt failed" will_retry and rethrows', async () => {
    await expect(runJobWithLogContext(job(), () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(queueLog().warn).toHaveBeenCalledTimes(1);
    const [message, extra] = queueLog().warn.mock.calls[0];
    expect(message).toBe('Job attempt failed');
    expect(extra).toMatchObject({ will_retry: true, error_name: 'Error', error_message: 'boom' });
    expect(LogService.flush).toHaveBeenCalledTimes(1);
  });

  it('AC-12: error_message is capped at 300 chars', async () => {
    await expect(runJobWithLogContext(job(), () => { throw new Error('z'.repeat(1000)); })).rejects.toThrow();
    expect(queueLog().warn.mock.calls[0][1].error_message).toHaveLength(300);
  });

  it('AC-12: a throw on the final attempt writes no failure line and rethrows', async () => {
    await expect(runJobWithLogContext(job({ attemptsMade: 2 }), () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(queueLog().warn).not.toHaveBeenCalled();
    expect(queueLog().error).not.toHaveBeenCalled();
    expect(LogService.flush).toHaveBeenCalledTimes(1);
  });

  it('AC-12: an UnrecoverableError on 1/3 writes no queue failure line and rethrows', async () => {
    const error = Object.assign(new Error('nope'), { name: 'UnrecoverableError' });
    await expect(runJobWithLogContext(job(), () => { throw error; })).rejects.toBe(error);
    expect(queueLog().warn).not.toHaveBeenCalled();
    expect(queueLog().error).not.toHaveBeenCalled();
  });

  it.each(['RateLimitError', 'DelayedError', 'WaitingChildrenError', 'WaitingError'])('AC-12: %s logs "Job deferred" and rethrows', async (name) => {
    const error = Object.assign(new Error('defer'), { name });
    await expect(runJobWithLogContext(job(), () => { throw error; })).rejects.toBe(error);
    expect(queueLog().info.mock.calls.map((c: any[]) => c[0])).toEqual(['Job started', 'Job deferred']);
    expect(queueLog().info.mock.calls[1][1]).toEqual({ reason: name });
    expect(queueLog().warn).not.toHaveBeenCalled();
  });

  it('AC-12: lifecycle:false writes no queue lines but still runs in the context and flushes', async () => {
    let seen: any;
    await runJobWithLogContext(job(), () => { seen = getLogContext(); }, { lifecycle: false });
    expect(seen.id).toBe('R');
    for (const fn of Object.values(queueLog() ?? {})) expect((fn as jest.Mock).mock.calls).toEqual([]);
    expect(LogService.flush).toHaveBeenCalledTimes(1);
  });

  it('AC-12: a rejecting flush never rejects the job', async () => {
    (LogService.flush as jest.Mock).mockRejectedValue(new Error('disk'));
    await expect(runJobWithLogContext(job(), async () => 1)).resolves.toBe(1);
  });
});

describe('logPermanentJobFailure', () => {
  const failing = (over: Record<string, unknown> = {}): any =>
    job({ attemptsMade: 3, data: { html: '<b>secret</b>', user_id: 1 }, queueQualifiedName: 'bull:mail', failedReason: 'x', stacktrace: [], ...over });

  it('AC-13: the final attempt logs exactly one error "Job failed permanently" with redacted data', async () => {
    await logPermanentJobFailure(failing(), new Error('boom'), 'active');
    expect(failedLog().error).toHaveBeenCalledTimes(1);
    const [message, extra] = failedLog().error.mock.calls[0];
    expect(message).toBe('Job failed permanently');
    expect(extra.will_retry).toBe(false);
    expect(extra.data.html).toBe('[redacted, 13 chars]');
    expect(extra).toMatchObject({ queue: 'mail', jobId: '1', jobName: 'n', attemptsMade: 3, maxAttempts: 3 });
    expect(LogService.flush).toHaveBeenCalled();
  });

  it('AC-13: runs inside the job trace (the logging call sees the carrier id and job ids)', async () => {
    let seen: any;
    failedLog; // ensure created
    await logPermanentJobFailure(failing(), new Error('boom'));
    // The mocked logger cannot read context, so verify through a context probe on the mock call.
    failedLog().error.mockImplementation(() => { seen = getLogContext(); });
    await logPermanentJobFailure(failing(), new Error('boom'));
    expect(seen.id).toBe('R');
    expect(seen.correlation).toMatchObject({ user_id: 7, job_id: '1', job_name: 'n' });
  });

  it('AC-13: a non-final attempt with a plain Error logs nothing', async () => {
    await logPermanentJobFailure(failing({ attemptsMade: 1 }), new Error('boom'));
    expect(failedLog()?.error?.mock.calls ?? []).toEqual([]);
  });

  it('AC-13: a non-final attempt with an UnrecoverableError logs one line', async () => {
    const error = Object.assign(new Error('nope'), { name: 'UnrecoverableError' });
    await logPermanentJobFailure(failing({ attemptsMade: 1 }), error);
    expect(failedLog().error).toHaveBeenCalledTimes(1);
  });

  it('AC-13: the no-job case logs "Queue worker failed with no job" and flushes', async () => {
    await logPermanentJobFailure(undefined, new Error('x'), 'active');
    expect(failedLog().error.mock.calls[0][0]).toBe('Queue worker failed with no job');
    expect(LogService.flush).toHaveBeenCalled();
  });
});
