const created: { cfg: Record<string, unknown>; logger: Record<string, jest.Mock> }[] = [];
jest.mock('../../config/logging', () => {
  const actual = jest.requireActual('../../config/logging');
  // Every factory hands its service and overrides to one mock, as the real ones build one config.
  const create = (_storage: unknown, cfg: Record<string, unknown>) => {
      const id = cfg.id;
      const logger = {
        info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), critical: jest.fn(),
        flush: jest.fn().mockResolvedValue(undefined),
        get id() {
          return typeof id === 'function' ? (id as () => unknown)() : id ?? null;
        },
      } as unknown as Record<string, jest.Mock>;
      created.push({ cfg, logger });
      return logger;
    };
  const factory = (service: string | null) => (overrides: Record<string, unknown> = {}) =>
    (create as (buffer: unknown, cfg: any) => unknown)(undefined, { service, ...overrides });
  return {
    ...actual,
    logService: { api: factory('api'), worker: factory('worker'), dbcli: factory('dbcli'), web: factory('web'), lib: factory(null) },
  };
});

import { JOB_FLUSH_LOGS } from '@repo/common-lib/constants/queues';
import { enqueueJob, enqueueJobs, jobLogConfig, jobLogContext, logPermanentJobFailure, readJobTrace, runJobWithLogs, withJobTrace } from '../job-trace';

const carrier = (id: unknown, v: unknown = 1) => JSON.stringify({ v, id });
const job = (over: Record<string, unknown> = {}): any => ({
  id: '1',
  name: 'n',
  queueName: 'q',
  attemptsMade: 0,
  opts: { attempts: 3, telemetry: { metadata: carrier('R') } },
  ...over,
});
const last = () => created[created.length - 1];

beforeEach(() => {
  created.length = 0;
});
afterEach(() => jest.restoreAllMocks());

describe('withJobTrace / readJobTrace', () => {
  it('round-trips the id', () => {
    expect(readJobTrace({ opts: withJobTrace({ attempts: 2 }, 'T') })).toEqual({ id: 'T' });
  });

  it('no id means no telemetry; an explicit telemetry is kept', () => {
    expect(withJobTrace({ attempts: 2 }, null)).toEqual({ attempts: 2 });
    const opts = { telemetry: { metadata: 'mine' } };
    expect(withJobTrace(opts, 'T')).toBe(opts);
  });

  it('malformed carriers give null', () => {
    expect(readJobTrace({ opts: { telemetry: { metadata: '{' } } })).toBeNull();
    expect(readJobTrace({ opts: { telemetry: { metadata: carrier('T', 2) } } })).toBeNull();
    expect(readJobTrace({ opts: { telemetry: { metadata: carrier('x'.repeat(129)) } } })).toBeNull();
  });

  it('jobLogConfig adds the job id to the given config', () => {
    expect(jobLogConfig(job(), { service: 'worker' })).toEqual({ service: 'worker', id: 'R' });
  });
});

describe('enqueueJob', () => {
  it('attaches the trace id from the log config and logs with that config', async () => {
    const queue = { name: 'q', add: jest.fn().mockResolvedValue({ id: '9' }) } as any;
    const data = { a: 1 };
    await enqueueJob(queue, 'n', data, { attempts: 2 }, { service: 'api', id: () => 'REQ' });
    const [, passedData, opts] = queue.add.mock.calls[0];
    expect(passedData).toBe(data);
    expect(readJobTrace({ opts })).toEqual({ id: 'REQ' });
    expect(last().cfg).toMatchObject({ service: 'api', defaultOptions: { channel: 'queue' } });
    expect(last().logger.info).toHaveBeenCalledWith('Job enqueued', expect.objectContaining({ queue: 'q', job_id: '9', operation: 'enqueue' }));
  });

  it('silent jobs write no line', async () => {
    const queue = { name: 'q', add: jest.fn().mockResolvedValue({ id: '9' }) } as any;
    await enqueueJob(queue, JOB_FLUSH_LOGS, {});
    expect(last().logger.info).not.toHaveBeenCalled();
  });
});

describe('runJobWithLogs', () => {
  it('logs started/completed with the job trace id and never flushes', async () => {
    await expect(runJobWithLogs(job(), async () => 5, { log: { service: 'worker' } })).resolves.toBe(5);
    expect(last().cfg).toMatchObject({ service: 'worker', id: 'R', defaultOptions: { channel: 'queue' } });
    expect(last().logger.info.mock.calls.map((c) => c[0])).toEqual(['Job started', 'Job completed']);
    expect(last().logger.flush).not.toHaveBeenCalled();
  });

  it('a non-final failure warns with will_retry; the final one writes nothing', async () => {
    await expect(runJobWithLogs(job(), () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(last().logger.warn).toHaveBeenCalledWith('Job attempt failed', expect.objectContaining({ will_retry: true, attempt: 1, operation: 'job' }));
    await expect(runJobWithLogs(job({ attemptsMade: 2 }), () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(last().logger.warn).not.toHaveBeenCalled();
  });
});

describe('logPermanentJobFailure', () => {
  it('logs once the attempts are used up, with the job trace id', async () => {
    await logPermanentJobFailure(job({ attemptsMade: 3 }), new Error('boom'), undefined, { service: 'worker' });
    expect(last().cfg).toMatchObject({ service: 'worker', id: 'R', defaultOptions: { channel: 'failed-job' } });
    expect(last().logger.error).toHaveBeenCalledWith('Job failed permanently', expect.objectContaining({ will_retry: false }));
    // failed-job lines have no operation (AC-6)
    expect(last().logger.error.mock.calls[0][1]).not.toHaveProperty('operation');
  });

  it('a non-final attempt logs nothing', async () => {
    await logPermanentJobFailure(job({ attemptsMade: 1 }), new Error('boom'));
    expect(last().logger.error).not.toHaveBeenCalled();
  });
});

describe('jobLogConfig without a trace', () => {
  it('keeps the caller id when the job has no trace', () => {
    expect(jobLogConfig({ opts: {} } as any, { id: 'mine' })).toEqual({ id: 'mine' });
  });
});

describe('AC-6: the carrier a caller hands over', () => {
  const queue = () => ({ name: 'q', add: jest.fn().mockResolvedValue({ id: '9' }), addBulk: jest.fn().mockResolvedValue([]) }) as any;

  it('only service, id and globalContext are read: a carrier cannot inject defaultOptions, format or a callback', async () => {
    const callback = jest.fn();
    const globalContext = () => ({ path: '/x' });
    const carrier = { service: 'api', id: 'T', globalContext, defaultOptions: { channel: 'auth' }, format: 'logfmt', callback: undefined, extra: 1 } as any;
    await enqueueJob(queue(), 'n', {}, undefined, carrier);
    const { cfg } = last();
    expect(cfg).toEqual({ service: 'api', id: 'T', globalContext, defaultOptions: { channel: 'queue' } });
    expect('callback' in cfg).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it.each(['api', 'worker', 'dbcli', 'web'])('a carrier service %s uses that service factory', async (service) => {
    await enqueueJob(queue(), 'n', {}, undefined, { service });
    expect(last().cfg.service).toBe(service);
  });

  it.each([[{}], [{ service: 'lib' }], [{ service: 'nope' }], [{ service: () => { throw new Error('x'); } }]])(
    'a carrier without a known service (%#) falls back to the process-service factory (lib)',
    async (carrier) => {
      await enqueueJob(queue(), 'n', {}, undefined, carrier as any);
      expect(last().cfg.service).toBeNull();
      expect(last().cfg.defaultOptions).toEqual({ channel: 'queue' });
    },
  );

  it('a service given as a function is resolved when the logger is built', async () => {
    await enqueueJob(queue(), 'n', {}, undefined, { service: () => 'worker' });
    expect(last().cfg.service).toBe('worker');
  });

  it('enqueueJobs writes its summary on channel queue with operation enqueue', async () => {
    await enqueueJobs(queue(), [{ name: 'a', data: {} }, { name: 'a', data: {} }], { service: 'api', id: 'T' });
    expect(last().cfg).toMatchObject({ service: 'api', id: 'T', defaultOptions: { channel: 'queue' } });
    expect(last().logger.info).toHaveBeenCalledWith('Jobs enqueued', expect.objectContaining({ queue: 'q', count: 2, operation: 'enqueue' }));
  });

  it('runJobWithLogs lines carry operation job in their options (no third argument)', async () => {
    await runJobWithLogs(job(), async () => 1);
    for (const call of last().logger.info.mock.calls) {
      expect(call).toHaveLength(2);
      expect(call[1]).toMatchObject({ operation: 'job', queue: 'q', job_name: 'n', job_id: '1', attempt: 1 });
    }
  });

  it('the carrier globalContext reaches the logger of a job line', async () => {
    const globalContext = jest.fn(() => jobLogContext(job()));
    await runJobWithLogs(job(), async () => 1, { log: { service: 'worker', globalContext } });
    expect(last().cfg.globalContext).toBe(globalContext);
  });
});

describe('AC-7: jobLogContext', () => {
  it('is an allow-list: exactly the five keys, never job.data', () => {
    const secret = { password: 'hunter2', token: 'tok-123', email: 'a@b.co' };
    const context = jobLogContext(job({ data: secret, name: 'send', id: 7, attemptsMade: 1 }));
    expect(context).toEqual({ queue: 'q', job_name: 'send', job_id: '7', attempt: 2, max_attempts: 3 });
    expect(Object.keys(context).sort()).toEqual(['attempt', 'job_id', 'job_name', 'max_attempts', 'queue']);
    expect(JSON.stringify(context)).not.toMatch(/hunter2|tok-123|a@b\.co/);
  });

  it('falls back for a job with no queue name, id or attempts', () => {
    expect(jobLogContext({ name: 'n', opts: {}, attemptsMade: undefined as never, id: undefined })).toEqual({
      queue: 'unknown',
      job_name: 'n',
      job_id: null,
      attempt: 1,
      max_attempts: 1,
    });
  });
});
