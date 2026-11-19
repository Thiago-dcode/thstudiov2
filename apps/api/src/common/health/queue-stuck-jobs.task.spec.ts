const mockLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
const redisStore = new Map<string, string>();
let redisDown = false;
let lockClient: unknown;
const mockRunCron = jest.fn();
let appConfig: { env: string; url: string };

jest.mock('@repo/backend-lib/config/logging', () => {
  // Patch the real factories so backend-lib's internal loggers see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/config/logging');
  const create = () => mockLog;
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
jest.mock('@repo/common-lib/config/utils', () => ({ getConfigValue: () => appConfig }));
jest.mock('../utils/cron-lock', () => ({
  CRON_LOCK_TTL: { minute: 50_000 },
  getLockClient: async () => {
    if (redisDown) throw new Error('redis down');
    return lockClient;
  },
  runCronExclusive: (...args: unknown[]) => mockRunCron(...args),
}));

import { logBuffer } from '@repo/backend-lib/config/logging';
import {
  delayedDueAt,
  delayedJobDueAt,
  evaluateQueue,
  failedWatermarkKey,
  MONITORED_QUEUES,
  newFailedJobs,
  pendingSince,
  QueueStuckJobsTask,
  STUCK_ALERT_COOLDOWN_MS,
  STUCK_AFTER_MS,
  stuckAlertKey,
} from './queue-stuck-jobs.task';

const NOW = 1_700_000_000_000;
const MIN = 60_000;

type FakeJob = Record<string, unknown>;
type FakeQueueState = {
  wait?: FakeJob[];
  prioritized?: FakeJob[];
  delayed?: FakeJob[];
  failed?: FakeJob[];
};

const makeQueue = (name: string, state: FakeQueueState = {}) => ({
  name,
  state,
  getJobCounts: jest.fn(async () => ({ wait: 0, prioritized: 0, delayed: 0, active: 0, failed: 0 })),
  // Honours the requested states, so a check that skips `prioritized` sees nothing.
  getJobs: jest.fn(async (types: string[]) =>
    types.flatMap((t) => (state as Record<string, FakeJob[] | undefined>)[t] ?? []),
  ),
  getDelayed: jest.fn(async () => state.delayed ?? []),
  getFailed: jest.fn(async () => state.failed ?? []),
});

class TestTask extends QueueStuckJobsTask {
  protected now() {
    return NOW;
  }
}

const build = (stripe: FakeQueueState = {}, plans: FakeQueueState = {}) => {
  const q1 = makeQueue('stripe-webhooks', stripe);
  const q2 = makeQueue('plan-subscriptions', plans);
  const task = new TestTask(q1 as never, q2 as never);
  return { task, q1, q2 };
};

const seedWatermark = (queue: string, value = NOW - 10 * MIN) =>
  redisStore.set(failedWatermarkKey(queue), String(value));

const allLogCalls = () => Object.values(mockLog).flatMap((fn) => fn.mock.calls);

describe('evaluateQueue', () => {
  const snap = (over: Partial<Parameters<typeof evaluateQueue>[0]>) => ({
    queue: 'stripe-webhooks',
    counts: {},
    pending: [],
    delayed: [],
    ...over,
  });

  it('AC-15: threshold is 2 minutes', () => {
    expect(STUCK_AFTER_MS).toBe(120_000);
  });

  it('AC-15: a pending job 90 s old is not stuck', () => {
    const result = evaluateQueue(snap({ pending: [{ id: '1', timestamp: NOW - 90_000 }] }), NOW);
    expect(result.stuck).toBe(false);
    expect(result.oldestPendingAgeMs).toBe(90_000);
  });

  it('AC-15: a pending job exactly 2 min old is not yet stuck, 2 min + 1 ms is', () => {
    expect(evaluateQueue(snap({ pending: [{ id: '1', timestamp: NOW - 120_000 }] }), NOW).stuck).toBe(false);
    expect(evaluateQueue(snap({ pending: [{ id: '1', timestamp: NOW - 120_001 }] }), NOW).stuck).toBe(true);
  });

  it('AC-15: the oldest of several pending jobs decides', () => {
    const result = evaluateQueue(
      snap({
        pending: [
          { id: 'new', timestamp: NOW - 5_000 },
          { id: 'old', timestamp: NOW - 5 * MIN },
        ],
      }),
      NOW,
    );
    expect(result.stuck).toBe(true);
    expect(result.oldestPendingAgeMs).toBe(5 * MIN);
    expect(result.stuckJobIds).toEqual(['old']);
  });

  it('AC-15: delayed job 3 min overdue is stuck; 1 min overdue or not yet due is not', () => {
    const overdue = evaluateQueue(snap({ delayed: [{ id: 'd', timestamp: NOW - 13 * MIN, delay: 10 * MIN }] }), NOW);
    expect(overdue.stuck).toBe(true);
    expect(overdue.oldestDelayedOverdueMs).toBe(3 * MIN);

    expect(evaluateQueue(snap({ delayed: [{ id: 'd', timestamp: NOW - 11 * MIN, delay: 10 * MIN }] }), NOW).stuck).toBe(false);
    const notDue = evaluateQueue(snap({ delayed: [{ id: 'd', timestamp: NOW, delay: 10 * MIN }] }), NOW);
    expect(notDue.stuck).toBe(false);
    expect(notDue.oldestDelayedOverdueMs).toBe(0);
  });

  it('AC-15: a long delay on an old job is not mistaken for a stuck pending job', () => {
    // enqueued 1 h ago with a 59 min delay: due 1 min ago
    const result = evaluateQueue(snap({ delayed: [{ id: 'd', timestamp: NOW - 60 * MIN, delay: 59 * MIN }] }), NOW);
    expect(result.stuck).toBe(false);
  });

  it('AC-15: nothing pending -> not stuck, null ages', () => {
    expect(evaluateQueue(snap({}), NOW)).toEqual({
      stuck: false,
      oldestPendingAgeMs: null,
      oldestDelayedOverdueMs: null,
      stuckJobIds: [],
    });
  });

  it('AC-15: lists at most 5 job ids', () => {
    const pending = Array.from({ length: 9 }, (_, i) => ({ id: String(i), timestamp: NOW - (10 + i) * MIN }));
    expect(evaluateQueue(snap({ pending }), NOW).stuckJobIds).toHaveLength(5);
  });
});

describe('retried jobs (creation timestamp is stale)', () => {
  const snap = (over: Partial<Parameters<typeof evaluateQueue>[0]>) => ({
    queue: 'stripe-webhooks',
    counts: {},
    pending: [],
    delayed: [],
    ...over,
  });
  // Created 10 min ago; the 2nd attempt failed 5 s ago; backoff of 2 s.
  const retried = {
    id: 'evt-retry',
    timestamp: NOW - 10 * MIN,
    attemptsMade: 2,
    processedOn: NOW - 6_000,
    delay: 2_000,
  };

  it('AC-15: delayedDueAt decodes the delayed-set score (dueAt * 0x1000 + counter)', () => {
    expect(delayedDueAt((NOW + 2_000) * 0x1000 + 7)).toBe(NOW + 2_000);
  });

  it('AC-15: a retried job delayed by the score is not stuck, however old its creation time', () => {
    const result = evaluateQueue(snap({ delayed: [{ ...retried, dueAt: NOW + 2_000 }] }), NOW);
    expect(result.stuck).toBe(false);
    expect(result.oldestDelayedOverdueMs).toBe(0);
  });

  it('AC-15: without the score, the fallback (processedOn + delay) also keeps a retried job not stuck', () => {
    expect(delayedJobDueAt(retried)).toBe(NOW - 6_000 + 2_000);
    expect(evaluateQueue(snap({ delayed: [retried] }), NOW).stuck).toBe(false);
  });

  it('AC-15: a retried job moved back to prioritized is not stuck', () => {
    expect(pendingSince(retried)).toBe(NOW - 4_000);
    const result = evaluateQueue(snap({ pending: [retried] }), NOW);
    expect(result.stuck).toBe(false);
    expect(result.oldestPendingAgeMs).toBe(4_000);
  });

  it('AC-15: a retried job genuinely overdue in delayed IS stuck', () => {
    const result = evaluateQueue(snap({ delayed: [{ ...retried, dueAt: NOW - 3 * MIN }] }), NOW);
    expect(result.stuck).toBe(true);
    expect(result.oldestDelayedOverdueMs).toBe(3 * MIN);
    expect(result.stuckJobIds).toEqual(['evt-retry']);
  });

  it('AC-15: a retried job that sat pending for 3 min after its backoff IS stuck', () => {
    const old = { ...retried, processedOn: NOW - 5 * MIN, delay: 2_000 };
    expect(evaluateQueue(snap({ pending: [old] }), NOW).stuck).toBe(true);
  });

  it('AC-15: a fresh job (no attempts) is still aged from creation', () => {
    expect(pendingSince({ id: 'a', timestamp: NOW - 3 * MIN })).toBe(NOW - 3 * MIN);
  });

  it('AC-15: end to end, a healthy-consumer retry (old timestamp, score in the future) raises no alert', async () => {
    const { task, q1 } = build({ delayed: [retried] });
    (q1 as unknown as { backend: unknown }).backend = {
      client: Promise.resolve({ zrange: async () => ['evt-retry', String((NOW + 2_000) * 0x1000)] }),
    };
    (q1 as unknown as { keys: unknown }).keys = { delayed: 'bull:stripe-webhooks:delayed' };
    await task.run();
    expect(mockLog.critical).not.toHaveBeenCalled();
  });
});

describe('newFailedJobs', () => {
  it('AC-17: keeps only jobs finished after the watermark, newest first', () => {
    const jobs = [{ finishedOn: 100 }, { finishedOn: 300 }, { finishedOn: 200 }, { finishedOn: undefined }];
    expect(newFailedJobs(jobs, 150).map((j) => j.finishedOn)).toEqual([300, 200]);
  });

  it('AC-17: a job finished exactly at the watermark is not new', () => {
    expect(newFailedJobs([{ finishedOn: 150 }], 150)).toEqual([]);
  });
});

describe('QueueStuckJobsTask', () => {
  beforeEach(() => {
    redisStore.clear();
    redisDown = false;
    appConfig = { env: 'production', url: 'https://a11studio.com' };
    Object.values(mockLog).forEach((fn) => fn.mockReset());
    mockRunCron.mockReset().mockImplementation(async (_n: string, _t: number, job: () => Promise<void>) => {
      await job();
      return true;
    });
    lockClient = {
      get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
      set: jest.fn(async (key: string, value: string, opts?: { condition?: string }) => {
        if (opts?.condition === 'NX' && redisStore.has(key)) return null;
        redisStore.set(key, value);
        return 'OK';
      }),
    };
    seedWatermark('stripe-webhooks');
    seedWatermark('plan-subscriptions');
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-14: monitors exactly stripe-webhooks and plan-subscriptions', () => {
    expect([...MONITORED_QUEUES]).toEqual(['stripe-webhooks', 'plan-subscriptions']);
  });

  it('AC-13: the cron runs under runCronExclusive("queue-stuck-jobs", 50 s, ..., { audit: false })', async () => {
    const { task } = build();
    await task.handleQueueStuckJobs();
    expect(mockRunCron).toHaveBeenCalledTimes(1);
    const [name, ttl, , options] = mockRunCron.mock.calls[0];
    expect(name).toBe('queue-stuck-jobs');
    expect(ttl).toBe(50_000);
    expect(options).toEqual({ audit: false });
  });

  it('AC-14: reads prioritized jobs (stripe uses priority 1, plans 10)', async () => {
    const { task, q1, q2 } = build();
    await task.run();
    for (const q of [q1, q2]) {
      const states = q.getJobs.mock.calls[0][0] as string[];
      expect(states).toEqual(expect.arrayContaining(['wait', 'prioritized']));
      expect(q.getJobs.mock.calls[0][1]).toBe(0);
      expect(q.getJobs.mock.calls[0][2]).toBe(49);
      expect(q.getDelayed).toHaveBeenCalledWith(0, 49);
      const counted = q.getJobCounts.mock.calls[0] as string[];
      expect(counted).toEqual(expect.arrayContaining(['wait', 'prioritized', 'delayed', 'active', 'failed']));
    }
  });

  it('AC-14/AC-15: a job stuck only in the prioritized state raises a critical (priority-trap regression)', async () => {
    const { task } = build({ prioritized: [{ id: 'evt-1', timestamp: NOW - 3 * MIN, data: { customer: 'a@b.com' } }] });
    await task.run();
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
    const [message, extra, opts] = mockLog.critical.mock.calls[0];
    expect(message).toBe('Queue "stripe-webhooks" has stuck jobs (a11studio.com)');
    expect(opts).toMatchObject({ operation: 'stuck-jobs' });
    expect(extra).toMatchObject({
      queue: 'stripe-webhooks',
      oldest_pending_age_s: 180,
      app_url: 'https://a11studio.com',
      app_env: 'production',
      job_ids: ['evt-1'],
    });
    expect(extra.counts).toBeDefined();
  });

  it('AC-15: the stuck alert never carries job data (Stripe PII)', async () => {
    const { task } = build({ prioritized: [{ id: 'evt-1', timestamp: NOW - 3 * MIN, data: { email: 'pii@example.com' } }] });
    await task.run();
    expect(JSON.stringify(allLogCalls())).not.toContain('pii@example.com');
  });

  it('AC-15: the critical message is constant (no counts, ages or ids) so dedup fingerprints stay stable', async () => {
    const a = build({ wait: [{ id: 'x1', timestamp: NOW - 3 * MIN }] });
    await a.task.run();
    redisStore.delete(stuckAlertKey('stripe-webhooks'));
    const b = build({ wait: [{ id: 'x2', timestamp: NOW - 9 * MIN }, { id: 'x3', timestamp: NOW - 8 * MIN }] });
    await b.task.run();
    const messages = mockLog.critical.mock.calls.map((c) => c[0]);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toBe(messages[1]);
  });

  it('AC-20: the message names the environment host (dev vs prod are distinguishable)', async () => {
    appConfig = { env: 'production', url: 'https://dev.a11studio.com' };
    const { task } = build({ wait: [{ id: 'x', timestamp: NOW - 3 * MIN }] });
    await task.run();
    expect(mockLog.critical.mock.calls[0][0]).toContain('dev.a11studio.com');
  });

  it('AC-15: a delayed job 3 min overdue raises a critical', async () => {
    const { task } = build({}, { delayed: [{ id: 'd1', timestamp: NOW - 13 * MIN, delay: 10 * MIN }] });
    await task.run();
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
    expect(mockLog.critical.mock.calls[0][0]).toContain('"plan-subscriptions"');
    expect(mockLog.critical.mock.calls[0][1]).toMatchObject({ oldest_delayed_overdue_s: 180 });
  });

  it('AC-15: a 90 s old job logs nothing', async () => {
    const { task } = build({ prioritized: [{ id: 'x', timestamp: NOW - 90_000 }] });
    await task.run();
    expect(mockLog.critical).not.toHaveBeenCalled();
  });

  it('AC-16: first stuck tick takes SET queue-health:alert:<queue>:stuck NX PX 30 min', async () => {
    const { task } = build({ wait: [{ id: 'x', timestamp: NOW - 3 * MIN }] });
    await task.run();
    expect(STUCK_ALERT_COOLDOWN_MS).toBe(1_800_000);
    expect((lockClient as { set: jest.Mock }).set).toHaveBeenCalledWith('queue-health:alert:stripe-webhooks:stuck', '1', {
      condition: 'NX',
      expiration: { type: 'PX', value: 1_800_000 },
    });
  });

  it('AC-16: cooldown held -> warn and no critical; repeated ticks send one mail', async () => {
    const { task } = build({ wait: [{ id: 'x', timestamp: NOW - 3 * MIN }] });
    await task.run();
    await task.run();
    await task.run();
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
    expect(mockLog.warn).toHaveBeenCalledTimes(2);
    expect(mockLog.warn.mock.calls[0][0]).toBe('Queue still stuck; alert in cooldown');
  });

  it('AC-16: two replicas ticking in the same minute alert once', async () => {
    const stuck = { wait: [{ id: 'x', timestamp: NOW - 3 * MIN }] };
    await build(stuck).task.run();
    await build(stuck).task.run();
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
  });

  it('AC-16: cooldown is per queue', async () => {
    const stuck = { wait: [{ id: 'x', timestamp: NOW - 3 * MIN }] };
    await build(stuck, stuck).task.run();
    expect(mockLog.critical).toHaveBeenCalledTimes(2);
  });

  it('AC-16: Redis down -> fails open with a critical', async () => {
    redisDown = true;
    const { task } = build({ wait: [{ id: 'x', timestamp: NOW - 3 * MIN }] });
    await expect(task.run()).resolves.toBeUndefined();
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
    expect(mockLog.critical.mock.calls[0][0]).toContain('has stuck jobs');
  });

  it('AC-16: null lock client -> fails open with a critical', async () => {
    lockClient = null;
    const { task } = build({ wait: [{ id: 'x', timestamp: NOW - 3 * MIN }] });
    await task.run();
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
  });

  it('AC-17: watermark missing -> set to now, no alert even with failed jobs', async () => {
    redisStore.clear();
    const { task } = build({ failed: [{ id: 'f1', name: 'x', finishedOn: NOW - MIN, failedReason: 'boom' }] });
    await task.run();
    expect(mockLog.critical).not.toHaveBeenCalled();
    expect(redisStore.get(failedWatermarkKey('stripe-webhooks'))).toBe(String(NOW));
    expect(redisStore.get(failedWatermarkKey('plan-subscriptions'))).toBe(String(NOW));
  });

  it('AC-17: a failed job older than the watermark is ignored', async () => {
    const { task, q1 } = build({ failed: [{ id: 'f1', name: 'x', finishedOn: NOW - 20 * MIN, failedReason: 'old' }] });
    await task.run();
    expect(q1.getFailed).toHaveBeenCalledWith(0, 49);
    expect(mockLog.critical).not.toHaveBeenCalled();
  });

  it('AC-17: a new failed job -> one critical with ids, masked reason and no data; watermark advances', async () => {
    const finishedOn = NOW - MIN;
    const { task } = build({
      failed: [
        {
          id: 'f1',
          name: 'checkout.session.completed',
          finishedOn,
          failedReason: 'No such customer: jane.doe@example.com',
          attemptsMade: 3,
          data: { secret: 'PII-PAYLOAD' },
        },
      ],
    });
    await task.run();

    expect(mockLog.critical).toHaveBeenCalledTimes(1);
    const [message, extra, opts] = mockLog.critical.mock.calls[0];
    expect(message).toBe('Queue "stripe-webhooks" has new failed jobs (a11studio.com)');
    expect(opts).toMatchObject({ operation: 'failed-jobs' });
    expect(extra.count).toBe(1);
    expect(extra.jobs[0]).toMatchObject({ id: 'f1', name: 'checkout.session.completed' });
    const serialized = JSON.stringify(allLogCalls());
    expect(serialized).not.toContain('PII-PAYLOAD');
    expect(serialized).not.toContain('jane.doe@example.com');
    expect(redisStore.get(failedWatermarkKey('stripe-webhooks'))).toBe(String(finishedOn));

    // The same failure does not alert again on the next tick.
    mockLog.critical.mockClear();
    await task.run();
    expect(mockLog.critical).not.toHaveBeenCalled();
  });

  it('AC-17: only the newest 5 failed jobs are listed, with the total count', async () => {
    const failed = Array.from({ length: 8 }, (_, i) => ({ id: `f${i}`, name: 'n', finishedOn: NOW - (i + 1) * 1000, failedReason: 'x' }));
    const { task } = build({ failed });
    await task.run();
    const extra = mockLog.critical.mock.calls[0][1];
    expect(extra.count).toBe(8);
    expect(extra.jobs).toHaveLength(5);
  });

  it('AC-18: healthy queues write zero log lines', async () => {
    const { task } = build({ wait: [{ id: 'x', timestamp: NOW - 10_000 }] });
    await task.run();
    expect(allLogCalls()).toHaveLength(0);
  });

  it('AC-12/robustness: one queue erroring is logged and does not stop the other', async () => {
    const { task, q1 } = build({}, { wait: [{ id: 'x', timestamp: NOW - 3 * MIN }] });
    q1.getJobCounts.mockRejectedValue(new Error('redis timeout'));
    await expect(task.run()).resolves.toBeUndefined();
    expect(mockLog.error).toHaveBeenCalledTimes(1);
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
    expect(mockLog.critical.mock.calls[0][0]).toContain('"plan-subscriptions"');
  });

  it('AC-15: a job removed between id and hash read (empty entry) does not crash the check', async () => {
    const { task } = build({ wait: [undefined as never, { id: 'x', timestamp: NOW - 3 * MIN }] });
    await task.run();
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
  });

  it('AC-18: never flushes at the end of a run (the worker writes the lines)', async () => {
    const { task } = build();
    const flush = jest.spyOn(logBuffer, 'flush');
    await task.run();
    expect(flush).not.toHaveBeenCalled();
  });
});
