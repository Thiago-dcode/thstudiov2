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
import { enqueueJob, jobLogConfig, logPermanentJobFailure, readJobTrace, runJobWithLogs, withJobTrace } from '../job-trace';

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
    expect(last().cfg).toMatchObject({ service: 'api', channel: 'queue' });
    expect(last().logger.info).toHaveBeenCalledWith('Job enqueued', expect.objectContaining({ queue: 'q', job_id: '9' }), { operation: 'enqueue' });
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
    expect(last().cfg).toMatchObject({ service: 'worker', id: 'R', channel: 'queue' });
    expect(last().logger.info.mock.calls.map((c) => c[0])).toEqual(['Job started', 'Job completed']);
    expect(last().logger.flush).not.toHaveBeenCalled();
  });

  it('a non-final failure warns with will_retry; the final one writes nothing', async () => {
    await expect(runJobWithLogs(job(), () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(last().logger.warn).toHaveBeenCalledWith('Job attempt failed', expect.objectContaining({ will_retry: true, attempt: 1 }), { operation: 'job' });
    await expect(runJobWithLogs(job({ attemptsMade: 2 }), () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(last().logger.warn).not.toHaveBeenCalled();
  });
});

describe('logPermanentJobFailure', () => {
  it('logs once the attempts are used up, with the job trace id', async () => {
    await logPermanentJobFailure(job({ attemptsMade: 3 }), new Error('boom'), undefined, { service: 'worker' });
    expect(last().cfg).toMatchObject({ service: 'worker', id: 'R', channel: 'failed-job' });
    expect(last().logger.error).toHaveBeenCalledWith('Job failed permanently', expect.objectContaining({ will_retry: false }));
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
