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
jest.mock('@repo/backend-lib/services/log-service', () => {
  // Patch the real class so backend-lib's internal imports see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/services/log-service');
  Object.assign(actual.FactoryLogService, { createLogService: () => mockCronLog });
  return actual;
});

import { LogService } from '@repo/backend-lib/services/log-service';
import { CRON_LOCK_TTL, runCronExclusive } from './cron-lock';

describe('runCronExclusive { audit }', () => {
  beforeEach(() => {
    store.clear();
    Object.values(mockCronLog).forEach((fn) => fn.mockReset());
    jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-13: CRON_LOCK_TTL.minute is 50 s, under the 60 s schedule interval', () => {
    expect(CRON_LOCK_TTL.minute).toBe(50_000);
    expect(CRON_LOCK_TTL.minute).toBeLessThan(60_000);
  });

  it('AC-19: audit:false runs the job and writes no started/completed lines', async () => {
    let calls = 0;
    const job = async () => {
      calls++;
    };
    await expect(runCronExclusive('quiet', CRON_LOCK_TTL.minute, job, { audit: false })).resolves.toBe(true);
    expect(calls).toBe(1);
    expect(mockCronLog.info).not.toHaveBeenCalled();
    expect(mockCronLog.error).not.toHaveBeenCalled();
  });

  it('AC-19: audit:false writes no "skipped" line when the lock is held', async () => {
    store.set('cron-lock:quiet-held', 'other');
    let calls = 0;
    const job = async () => {
      calls++;
    };
    await expect(runCronExclusive('quiet-held', CRON_LOCK_TTL.minute, job, { audit: false })).resolves.toBe(false);
    expect(calls).toBe(0);
    expect(mockCronLog.info).not.toHaveBeenCalled();
  });

  it('AC-19: audit:false still logs "Cron run failed" and rethrows', async () => {
    await expect(
      runCronExclusive(
        'quiet-fail',
        CRON_LOCK_TTL.minute,
        async () => {
          throw new Error('db down');
        },
        { audit: false },
      ),
    ).rejects.toThrow('db down');
    expect(mockCronLog.error).toHaveBeenCalledTimes(1);
    expect(mockCronLog.error.mock.calls[0][0]).toBe('Cron run failed');
    expect(mockCronLog.info).not.toHaveBeenCalled();
  });

  it('AC-19: default (no options) keeps started and completed lines', async () => {
    await runCronExclusive('loud', CRON_LOCK_TTL.daily, async () => undefined);
    expect(mockCronLog.info.mock.calls.map((c) => c[0])).toEqual(['Cron run started', 'Cron run completed']);
  });

  it('AC-19: audit:true explicit behaves like the default, including "skipped"', async () => {
    store.set('cron-lock:loud-held', 'other');
    await runCronExclusive('loud-held', CRON_LOCK_TTL.daily, async () => undefined, { audit: true });
    expect(mockCronLog.info.mock.calls[0][0]).toBe('Cron run skipped');
  });
});
