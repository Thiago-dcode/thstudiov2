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
jest.mock('@repo/backend-lib/services/log-service/factory', () => ({
  FactoryLogService: { createLogService: () => mockCronLog },
}));

import { getLogContext } from '@repo/backend-lib/services/log-service';
import { LogService } from '@repo/backend-lib/services/log-service/base';
import { withJobTrace } from '@repo/backend-lib/utils';
import { CRON_LOCK_TTL, runCronExclusive } from './cron-lock';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('runCronExclusive audit lines', () => {
  beforeEach(() => {
    store.clear();
    Object.values(mockCronLog).forEach((fn) => fn.mockReset());
    jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-15: the job runs in a context with a UUID id and correlation {cron}; started and completed lines carry the operation', async () => {
    let seen: any;
    await runCronExclusive('nightly', CRON_LOCK_TTL.daily, async () => {
      seen = getLogContext();
    });
    expect(seen.id).toMatch(UUID);
    expect(seen.correlation).toEqual({ cron: 'nightly' });
    expect(mockCronLog.info.mock.calls.map((c) => c[0])).toEqual(['Cron run started', 'Cron run completed']);
    expect(mockCronLog.info.mock.calls[0][2]).toEqual({ operation: 'nightly' });
    expect(typeof mockCronLog.info.mock.calls[1][1].duration_ms).toBe('number');
    expect(LogService.flush).toHaveBeenCalled();
  });

  it('AC-15: every run gets a fresh id', async () => {
    const ids: string[] = [];
    for (const name of ['a', 'b']) {
      await runCronExclusive(name, CRON_LOCK_TTL.daily, async () => {
        ids.push(getLogContext()!.id!);
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
    expect(mockCronLog.error.mock.calls[0][1]).toMatchObject({ error_name: 'Error', error_message: 'db down' });
    expect(LogService.flush).toHaveBeenCalled();
  });

  it('AC-15: a lock held elsewhere logs "Cron run skipped" {reason:lock_held} and never calls the job', async () => {
    store.set('cron-lock:held', 'other');
    const job = jest.fn();
    await expect(runCronExclusive('held', CRON_LOCK_TTL.daily, job)).resolves.toBe(false);
    expect(job).not.toHaveBeenCalled();
    const [message, extra, fields] = mockCronLog.info.mock.calls[0];
    expect(message).toBe('Cron run skipped');
    expect(extra).toEqual({ reason: 'lock_held' });
    expect(fields).toEqual({ operation: 'held', correlation: { cron: 'held' } });
  });

  it('AC-15: an enqueue inside the job carries the run id and cron correlation', async () => {
    let carrier: any;
    let runId: string | null = null;
    await runCronExclusive('enqueuer', CRON_LOCK_TTL.daily, async () => {
      runId = getLogContext()!.id;
      carrier = JSON.parse(withJobTrace().telemetry!.metadata as string);
    });
    expect(carrier.id).toBe(runId);
    expect(carrier.c).toEqual({ cron: 'enqueuer' });
  });
});
