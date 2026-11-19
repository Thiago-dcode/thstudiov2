const mockLoggers: Record<string, Record<string, jest.Mock>> = {};
const mockConfigs: Record<string, Record<string, unknown>> = {};

jest.mock('@repo/backend-lib/config/logging', () => {
  // Patch the real factories so backend-lib's internal loggers see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/config/logging');
  const create = (_t: unknown, cfg: { channel: string }) => {
      mockConfigs[cfg.channel] = cfg;
      mockLoggers[cfg.channel] ??= { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn(), name: jest.fn() };
      return mockLoggers[cfg.channel];
    };
  const factory = (service: string | null) => (overrides: Record<string, unknown> = {}) =>
    (create as (buffer: unknown, cfg: any) => unknown)(undefined, { service, ...overrides });
  // backend-lib's own import cycle (config/logging -> critical-alert-mail -> job-trace) re-enters
  // this factory before the module has finished loading; patch once `logService` exists.
  if (actual.logService) {
    Object.assign(actual.logService, {
      api: factory('api'), worker: factory('worker'), dbcli: factory('dbcli'), web: factory('web'), lib: factory(null),
    });
  }
  return actual;
});

import { currentRequestId } from 'src/common/services/request-storage';
import { GlobalProcessor } from './global.processor';

/** The trace id the processor's DI loggers would read (`apiLogConfig().id`). */
const resolveId = (cfg: Record<string, unknown>) =>
  typeof cfg.id === 'function' ? (cfg.id as () => string | null)() : cfg.id;

class TestProcessor extends (GlobalProcessor as any) {
  seen: string | null = null;
  seenQueueLogId: unknown = undefined;
  async process(_job: any) {
    this.seen = currentRequestId();
    this.seenQueueLogId = resolveId(mockConfigs['queue']);
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
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-13: process runs in a store with the carrier id (the wrapper is applied in the constructor)', async () => {
    const p: any = new TestProcessor();
    await expect(p.process(fakeJob({ attemptsMade: 0 }))).resolves.toBe('done');
    expect(p.seen).toBe('R');
    expect(mockConfigs['queue']).toMatchObject({ service: 'api', id: 'R' });
    expect(mockLoggers['queue'].info.mock.calls.map((c) => c[0])).toEqual(['Job started', 'Job completed']);
    expect(mockLoggers['queue'].info.mock.calls[0][1]).toMatchObject({ job_id: '9', job_name: 'send-mail', queue: 'mail', attempt: 1 });
  });

  it('AC-13: without a carrier the job runs under a fresh UUID', async () => {
    const p: any = new TestProcessor();
    await p.process(fakeJob({ attemptsMade: 0, opts: { attempts: 1 } }));
    expect(p.seen).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(p.seenQueueLogId).toBe(p.seen);
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

  it('AC-13: the permanent-failure line is written with the api service and the carrier id', async () => {
    const p: any = new TestProcessor();
    await p.onFailed(fakeJob(), new Error('x'), 'active');
    expect(mockConfigs['failed-job']).toMatchObject({ service: 'api', id: 'R' });
    expect(mockLoggers['failed-job'].error.mock.calls[0][1]).toMatchObject({ jobId: '9', jobName: 'send-mail', queue: 'mail' });
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
