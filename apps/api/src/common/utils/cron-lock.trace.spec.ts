const mockCronLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const store = new Map<string, string>();

jest.mock('redis', () => ({
  createClient: () => ({
    on: jest.fn(),
    connect: jest.fn(async () => undefined),
    set: jest.fn(async (key: string, value: string, opts: { condition?: string }) => {
      if (opts.condition === 'NX' && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    }),
  }),
}));
jest.mock('@repo/common-lib/config/utils', () => ({ getConfigValue: () => ({ url: 'redis://test' }) }));
jest.mock('@repo/backend-lib/config/logging', () => {
  // Patch the real factories so backend-lib's internal loggers see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/config/logging');
  const create = () => mockCronLog;
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

import { logBuffer } from '@repo/backend-lib/config/logging';
import { withJobTrace } from '@repo/backend-lib/utils';
import { currentRequestId } from 'src/common/services/request-storage';
import { apiTraceCarrier } from 'src/common/services/request.service';
import { CRON_LOCK_TTL, runCronExclusive } from './cron-lock';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('runCronExclusive audit lines', () => {
  beforeEach(() => {
    store.clear();
    Object.values(mockCronLog).forEach((fn) => fn.mockReset());
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-15: the job runs in a store with a UUID trace id; started and completed lines carry the operation and {cron}; nothing is flushed', async () => {
    const flush = jest.spyOn(logBuffer, 'flush');
    let seen: string | null = null;
    await runCronExclusive('nightly', CRON_LOCK_TTL.daily, async () => {
      seen = currentRequestId();
    });
    expect(seen).toMatch(UUID);
    expect(mockCronLog.info.mock.calls.map((c) => c[0])).toEqual(['Cron run started', 'Cron run completed']);
    expect(mockCronLog.info.mock.calls[0][1]).toEqual({ cron: 'nightly', operation: 'nightly' });
    expect(mockCronLog.info.mock.calls[1][1]).toMatchObject({ cron: 'nightly' });
    expect(typeof mockCronLog.info.mock.calls[1][1].duration_ms).toBe('number');
    expect(flush).not.toHaveBeenCalled();
  });

  it('AC-15: every run gets a fresh id', async () => {
    const ids: string[] = [];
    for (const name of ['a', 'b']) {
      await runCronExclusive(name, CRON_LOCK_TTL.daily, async () => {
        ids.push(currentRequestId()!);
      });
    }
    expect(new Set(ids).size).toBe(2);
  });

  it('AC-15: a throwing job logs "Cron run failed" and rejects', async () => {
    await expect(
      runCronExclusive('boom', CRON_LOCK_TTL.daily, async () => {
        throw new Error('db down');
      }),
    ).rejects.toThrow('db down');
    expect(mockCronLog.error).toHaveBeenCalledTimes(1);
    expect(mockCronLog.error.mock.calls[0][0]).toBe('Cron run failed');
    expect(mockCronLog.error.mock.calls[0][1]).toMatchObject({ cron: 'boom', error_name: 'Error', error_message: 'db down' });
  });

  it('AC-15: a lock held elsewhere logs "Cron run skipped" {reason:lock_held} and never calls the job', async () => {
    store.set('cron-lock:held', 'other');
    const job = jest.fn();
    await expect(runCronExclusive('held', CRON_LOCK_TTL.daily, job)).resolves.toBe(false);
    expect(job).not.toHaveBeenCalled();
    const [message, extra] = mockCronLog.info.mock.calls[0];
    expect(message).toBe('Cron run skipped');
    expect(extra).toEqual({ cron: 'held', reason: 'lock_held', operation: 'held' });
  });

  it('AC-15: an enqueue inside the job (with apiTraceCarrier) carries the run id', async () => {
    let carrier: any;
    let runId: string | null = null;
    await runCronExclusive('enqueuer', CRON_LOCK_TTL.daily, async () => {
      runId = currentRequestId();
      const id = apiTraceCarrier().id as () => string | null;
      carrier = JSON.parse(withJobTrace(undefined, id()).telemetry!.metadata as string);
    });
    expect(carrier.id).toBe(runId);
  });
});
