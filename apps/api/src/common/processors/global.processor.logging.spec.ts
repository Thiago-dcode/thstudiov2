const mockLoggers: Record<string, Record<string, jest.Mock>> = {};

jest.mock('@repo/backend-lib/services/log-service', () => {
  // Patch the real class so backend-lib's internal imports see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/services/log-service');
  Object.assign(actual.FactoryLogService, {
    createLogService: (_t: string, cfg: { channel: string }) => {
      mockLoggers[cfg.channel] ??= { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn(), name: jest.fn() };
      return mockLoggers[cfg.channel];
    },
  });
  return actual;
});

import { LOG_QUEUE } from '@repo/common-lib/constants/queues';
import { LogService } from '@repo/backend-lib/services/log-service';
import { getLogContext } from '@repo/backend-lib/services/log-service';
import { GlobalProcessor } from './global.processor';

class TestProcessor extends (GlobalProcessor as any) {
  seen: any;
  async process(_job: any) {
    this.seen = getLogContext();
    return 'done';
  }
}

const carrier = (id: string) => JSON.stringify({ v: 1, id, c: { user_id: 7 } });
const fakeJob = (over: Record<string, unknown> = {}): any => ({
  id: '9',
  name: 'send-mail',
  queueName: 'mail',
  queueQualifiedName: 'bull:mail',
  attemptsMade: 3,
  opts: { attempts: 3, telemetry: { metadata: carrier('R') } },
  data: { html: '<b>1</b>' },
  stacktrace: [],
  ...over,
});

describe('GlobalProcessor', () => {
  beforeEach(() => {
    for (const channel of Object.values(mockLoggers)) Object.values(channel).forEach((fn) => fn.mockReset());
    jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-13: process runs inside the job context with the carrier id (the wrapper is applied in the constructor)', async () => {
    const p: any = new TestProcessor();
    await expect(p.process(fakeJob({ attemptsMade: 0 }))).resolves.toBe('done');
    expect(p.seen.id).toBe('R');
    expect(p.seen.correlation).toMatchObject({ user_id: 7, job_id: '9', job_name: 'send-mail', queue: 'mail', attempt: 1 });
    expect(mockLoggers['queue'].info.mock.calls.map((c) => c[0])).toEqual(['Job started', 'Job completed']);
  });

  it('AC-13: a LOG_QUEUE job runs in the context but writes no queue lines', async () => {
    const p: any = new TestProcessor();
    await p.process(fakeJob({ queueName: LOG_QUEUE, attemptsMade: 0 }));
    expect(p.seen.id).toBe('R');
    for (const fn of Object.values(mockLoggers['queue'] ?? {})) expect(fn.mock.calls).toEqual([]);
  });

  it('AC-13: a subclass without process() constructs fine (wrap skipped)', () => {
    class Bare extends (GlobalProcessor as any) {}
    expect(() => new Bare()).not.toThrow();
  });

  it('AC-13: onFailed on the final attempt logs one "Job failed permanently" with the carrier trace and redacted data', async () => {
    const p: any = new TestProcessor();
    const failedLog = () => mockLoggers['failed-job'];
    await p.onFailed(fakeJob(), new Error('x'), 'active');
    expect(failedLog().error).toHaveBeenCalledTimes(1);
    const [message, extra] = failedLog().error.mock.calls[0];
    expect(message).toBe('Job failed permanently');
    expect(extra.will_retry).toBe(false);
    expect(extra.queue).toBe('mail');
    expect(extra.data.html).toBe('[redacted, 8 chars]');
    expect(failedLog().name).not.toHaveBeenCalled();
  });

  it('AC-13: the permanent-failure line is logged inside the carrier context (id and job ids)', async () => {
    const p: any = new TestProcessor();
    let seen: any;
    await p.onFailed(fakeJob(), new Error('x'), 'active');
    mockLoggers['failed-job'].error.mockImplementation(() => { seen = getLogContext(); });
    await p.onFailed(fakeJob(), new Error('x'), 'active');
    expect(seen.id).toBe('R');
    expect(seen.correlation).toMatchObject({ job_id: '9', job_name: 'send-mail', queue: 'mail', user_id: 7 });
  });

  it('AC-13: a non-final attempt with a plain Error logs nothing; an UnrecoverableError logs once', async () => {
    const p: any = new TestProcessor();
    await p.onFailed(fakeJob({ attemptsMade: 1 }), new Error('x'), 'active');
    expect(mockLoggers['failed-job']?.error?.mock.calls ?? []).toEqual([]);
    await p.onFailed(fakeJob({ attemptsMade: 1 }), Object.assign(new Error('x'), { name: 'UnrecoverableError' }), 'active');
    expect(mockLoggers['failed-job'].error).toHaveBeenCalledTimes(1);
  });

  it('AC-13: a failed event with no job logs "Queue worker failed with no job"', async () => {
    const p: any = new TestProcessor();
    await p.onFailed(undefined, new Error('x'), 'active');
    expect(mockLoggers['failed-job'].error.mock.calls[0][0]).toBe('Queue worker failed with no job');
  });
});
