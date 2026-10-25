/* eslint-disable turbo/no-undeclared-env-vars -- test-only variables, never read by a build or the app */
import { Job, Queue, Worker } from 'bullmq';
import { createClient } from 'redis';
import { JOB_PURGE_ARTIST_EDGE_CACHE } from '@repo/common-lib/constants/queues';
import type { PurgeArtistEdgeCacheJobInput } from '@repo/common-lib/types/edge-cache';
import { getLockClient } from 'src/common/utils/cron-lock';
import { EdgeCacheProcessor } from './edge-cache.processor';
import { EdgeCacheService } from './edge-cache.service';
import {
  EDGE_PURGE_CALLS_PER_WINDOW,
  EDGE_PURGE_WINDOW_MS,
  EdgePurgeLedger,
} from './edge-purge-ledger';

/**
 * Against a REAL Redis, and only when `EDGE_PURGE_TEST_REDIS_URL` points at a throwaway database
 * (e.g. `redis://localhost:6379/15`): it is flushed before and after. Skipped otherwise (CI has no
 * Redis). Covers what the unit specs fake: the ledger's Lua, and BullMQ handing a rate-limited job
 * back without spending an attempt.
 */
const REDIS_URL = process.env.EDGE_PURGE_TEST_REDIS_URL;
const describeRedis = REDIS_URL ? describe : describe.skip;

describeRedis('EdgePurgeLedger + BullMQ rate limit (real Redis)', () => {
  let admin: ReturnType<typeof createClient>;
  const savedRedisUrl = process.env.REDIS_URL;

  beforeAll(async () => {
    // The ledger shares the process-wide client from `cron-lock`, which reads REDIS_URL.
    process.env.REDIS_URL = REDIS_URL;
    admin = createClient({ url: REDIS_URL });
    await admin.connect();
    await admin.flushDb();
  });

  afterAll(async () => {
    await admin.flushDb();
    await admin.quit();
    await (await getLockClient())?.quit();
    process.env.REDIS_URL = savedRedisUrl;
  });

  beforeEach(async () => {
    await admin.flushDb();
  });

  const redisNow = async () => {
    const [seconds, micros] = (await admin.sendCommand(['TIME'])) as [string, string];
    return Number(seconds) * 1000 + Math.floor(Number(micros) / 1000);
  };

  it(`grants ${EDGE_PURGE_CALLS_PER_WINDOW} calls per sliding window, then says how long to wait`, async () => {
    const ledger = new EdgePurgeLedger();

    for (let i = 0; i < EDGE_PURGE_CALLS_PER_WINDOW; i++) {
      await expect(ledger.takeSlots(1)).resolves.toEqual({ ok: true });
    }
    const denied = await ledger.takeSlots(1);

    expect(denied.ok).toBe(false);
    const wait = (denied as { retryInMs: number }).retryInMs;
    expect(wait).toBeGreaterThan(EDGE_PURGE_WINDOW_MS - 5_000);
    expect(wait).toBeLessThanOrEqual(EDGE_PURGE_WINDOW_MS + 1);
    // A denied take reserves nothing.
    expect(await admin.zCard('edge-purge:cf-calls')).toBe(EDGE_PURGE_CALLS_PER_WINDOW);
  });

  it('frees a slot once the oldest call leaves the window', async () => {
    const ledger = new EdgePurgeLedger();
    const now = await redisNow();
    // Three calls 59.5 s ago (about to leave the window) and one just now.
    for (let i = 0; i < 3; i++) {
      await admin.zAdd('edge-purge:cf-calls', { score: now - EDGE_PURGE_WINDOW_MS + 500, value: `old-${i}` });
    }
    await admin.zAdd('edge-purge:cf-calls', { score: now, value: 'recent' });

    const denied = await ledger.takeSlots(1);
    expect(denied).toEqual({ ok: false, retryInMs: expect.any(Number) });
    expect((denied as { retryInMs: number }).retryInMs).toBeLessThanOrEqual(600);

    await new Promise((resolve) => setTimeout(resolve, (denied as { retryInMs: number }).retryInMs + 50));
    await expect(ledger.takeSlots(1)).resolves.toEqual({ ok: true });
  });

  it('only ever moves the last-purged stamp forward', async () => {
    const ledger = new EdgePurgeLedger();

    await expect(ledger.lastPurgedAt(7)).resolves.toBeNull();
    await ledger.markPurged(7, 2_000);
    await ledger.markPurged(7, 1_000);
    await expect(ledger.lastPurgedAt(7)).resolves.toBe(2_000);
    await ledger.markPurged(7, 3_000);
    await expect(ledger.lastPurgedAt(7)).resolves.toBe(3_000);
    // Expires on its own.
    expect(await admin.pTTL('edge-purge:last-purged:7')).toBeGreaterThan(0);
  });

  it('a rate-limited job goes back to wait without spending an attempt, then runs once a slot frees', async () => {
    const queueName = `edge-cache-it-${Date.now()}`;
    const connection = { url: REDIS_URL! };
    const queue = new Queue(queueName, { connection });
    const ledger = new EdgePurgeLedger();
    const logger = {
      name: () => logger,
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      flushAsync: async () => undefined,
    };
    const service = new EdgeCacheService(logger as never);
    jest
      .spyOn(service, 'purgeTarget')
      .mockReturnValue({ host: 'a11studio.com', zoneId: 'zone', token: 'token' });
    const purgePrefixes = jest.spyOn(service, 'purgePrefixes').mockResolvedValue(undefined);
    const processor = new EdgeCacheProcessor(
      service,
      { findByIdCompact: async () => ({ id: 7, username: 'ana' }) } as never,
      { findReservedByUser: async () => [] } as never,
      logger as never,
      ledger,
      queue,
    );
    // The window is full, but its oldest call leaves it in ~1 s.
    const now = await redisNow();
    for (let i = 0; i < EDGE_PURGE_CALLS_PER_WINDOW; i++) {
      await admin.zAdd('edge-purge:cf-calls', {
        score: now - EDGE_PURGE_WINDOW_MS + 1_000 + i,
        value: `prefill-${i}`,
      });
    }

    const worker = new Worker<PurgeArtistEdgeCacheJobInput>(queueName, (job) => processor.process(job), {
      connection,
      concurrency: 1,
      autorun: false,
    });
    try {
      const done = new Promise<Job>((resolve, reject) => {
        worker.on('completed', (job) => resolve(job));
        worker.on('failed', (_job, error) => reject(error));
      });
      const startedAt = Date.now();
      // `priority: 10` as in production (`QueueHelper.createPurgeArtistEdgeCacheJob`): BullMQ moves a
      // rate-limited prioritized job back to the queue by a different path than an unprioritized one.
      await queue.add(JOB_PURGE_ARTIST_EDGE_CACHE, { user_id: 7 }, { attempts: 4, priority: 10 });
      void worker.run();

      const job = await done;

      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(800);
      expect(purgePrefixes).toHaveBeenCalledTimes(1);
      expect(job.returnvalue).toEqual(expect.objectContaining({ purged: true }));
      // The bounce did not count as an attempt.
      expect(job.attemptsMade).toBe(1);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('waiting'));
      await expect(ledger.lastPurgedAt(7)).resolves.toBeGreaterThanOrEqual(startedAt);
    } finally {
      await worker.close();
      await queue.obliterate({ force: true });
      await queue.close();
    }
  }, 20_000);
});
