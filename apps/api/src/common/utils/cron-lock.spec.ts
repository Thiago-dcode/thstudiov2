const store = new Map<string, string>();
const connect = jest.fn(async () => undefined);
let failSet = false;

jest.mock('redis', () => ({
  createClient: () => ({
    on: jest.fn(),
    connect,
    set: jest.fn(async (key: string, value: string, opts: { condition?: string }) => {
      if (failSet) throw new Error('redis down');
      if (opts.condition === 'NX' && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    }),
  }),
}));

jest.mock('@repo/common-lib/config/utils', () => ({
  getConfigValue: () => ({ url: 'redis://test' }),
}));

import { CRON_LOCK_TTL, runCronExclusive } from './cron-lock';

/** A job that only counts its runs (the lint setup here cannot type `jest.fn`). */
const countingJob = () => {
  const job = async () => {
    job.calls++;
  };
  job.calls = 0;
  return job;
};

describe('runCronExclusive', () => {
  beforeEach(() => {
    store.clear();
    failSet = false;
  });

  it('runs the job on the first replica and skips it on the second', async () => {
    const job = countingJob();

    const first = await runCronExclusive('wait-list-reminders', CRON_LOCK_TTL.daily, job);
    const second = await runCronExclusive('wait-list-reminders', CRON_LOCK_TTL.daily, job);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(job.calls).toBe(1);
  });

  it('locks each job name independently', async () => {
    const job = countingJob();

    await runCronExclusive('portfolio-task', CRON_LOCK_TTL.daily, job);
    await runCronExclusive('collection-task', CRON_LOCK_TTL.daily, job);

    expect(job.calls).toBe(2);
  });

  it('fails open and still runs the job when Redis errors', async () => {
    failSet = true;
    const job = countingJob();

    await expect(runCronExclusive('indexnow-submit', CRON_LOCK_TTL.hourly, job)).resolves.toBe(true);
    expect(job.calls).toBe(1);
  });

  it('keeps the TTLs below their schedule intervals', () => {
    expect(CRON_LOCK_TTL.hourly).toBeLessThan(60 * 60 * 1000);
    expect(CRON_LOCK_TTL.daily).toBeLessThan(24 * 60 * 60 * 1000);
  });
});
