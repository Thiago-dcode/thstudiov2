import { HttpException, HttpStatus } from '@nestjs/common';
import { RATE_LIMIT_ERROR } from 'bullmq';
import { EDGE_PURGE_DEBOUNCE_MS } from '@repo/common-lib/constants/edge-cache';
import { JOB_PURGE_ARTIST_EDGE_CACHE } from '@repo/common-lib/constants/queues';
import { EdgeCacheProcessor } from './edge-cache.processor';
import { EdgeCacheService, EdgePurgeTarget } from './edge-cache.service';
import { EDGE_PURGE_CALLS_PER_WINDOW, EDGE_PURGE_WINDOW_MS } from './edge-purge-ledger';

/**
 * Review round 1: one artist's burst must not hold another artist's purge back, and no trigger may
 * be lost. Simulated on a virtual clock with the REAL processor and prefix builder. The queue is
 * modelled as BullMQ runs it here: a job becomes ready `EDGE_PURGE_DEBOUNCE_MS` after its trigger,
 * ready jobs run FIFO one at a time, and a rate-limited job goes back to the front while the worker
 * waits out the limit. The ledger is an in-memory copy of the Redis one (its Lua is exercised
 * against real Redis in `edge-purge-ledger.redis.spec.ts`).
 */
const TARGET: EdgePurgeTarget = { host: 'a11studio.com', zoneId: 'zone', token: 'token' };
const ARTIST_A = 1;
const ARTIST_B = 2;
const USERNAMES: Record<number, string> = { [ARTIST_A]: 'artist-a', [ARTIST_B]: 'artist-b' };

type Trigger = { userId: number; at: number };
type Call = { at: number; userId: number };

const simulate = (triggers: Trigger[], { purgeTakesMs = 0 } = {}) => {
  let now = 0;
  jest.spyOn(Date, 'now').mockImplementation(() => now);

  const calls: number[] = [];
  const lastPurged = new Map<number, number>();
  const ledger = {
    lastPurgedAt: async (userId: number) => lastPurged.get(userId) ?? null,
    markPurged: async (userId: number, at: number) => {
      lastPurged.set(userId, Math.max(lastPurged.get(userId) ?? 0, at));
    },
    takeSlots: async (cost: number) => {
      const live = calls.filter((at) => at > now - EDGE_PURGE_WINDOW_MS);
      calls.length = 0;
      calls.push(...live);
      if (live.length + cost <= EDGE_PURGE_CALLS_PER_WINDOW) {
        for (let i = 0; i < cost; i++) calls.push(now);
        return { ok: true as const };
      }
      const freeing = live[live.length + cost - EDGE_PURGE_CALLS_PER_WINDOW - 1];
      return { ok: false as const, retryInMs: freeing + EDGE_PURGE_WINDOW_MS - now + 1 };
    },
  };

  let rateLimitedFor = 0;
  const queue = { rateLimit: async (ms: number) => void (rateLimitedFor = ms) };
  const logger = {
    name: () => logger,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    flushAsync: async () => undefined,
  };
  const service = new EdgeCacheService(logger as never);
  jest.spyOn(service, 'purgeTarget').mockReturnValue(TARGET);
  const cloudflare: Call[] = [];
  jest.spyOn(service, 'purgePrefixes').mockImplementation(async (_target, prefixes) => {
    const userId = Number(Object.keys(USERNAMES).find((id) => prefixes[0].endsWith(`/${USERNAMES[Number(id)]}`)));
    cloudflare.push({ at: now, userId });
    now += purgeTakesMs;
  });
  const userRepository = {
    findByIdCompact: async (id: number) => {
      if (!USERNAMES[id]) throw new HttpException('nf', HttpStatus.NOT_FOUND);
      return { id, username: USERNAMES[id] };
    },
  };
  const history = { findReservedByUser: async () => [] as string[] };
  const processor = new EdgeCacheProcessor(
    service,
    userRepository as never,
    history as never,
    logger as never,
    ledger as never,
    queue as never,
  );

  // One job per trigger: every trigger in these scenarios is more than the debounce window apart
  // from the previous one of the same artist, so deduplication merges none of them.
  const pending = triggers
    .map((trigger) => ({ ...trigger, readyAt: trigger.at + EDGE_PURGE_DEBOUNCE_MS }))
    .sort((a, b) => a.readyAt - b.readyAt);
  const results: { userId: number; at: number; reason: string }[] = [];

  return (async () => {
    let guard = 0;
    while (pending.length) {
      if (++guard > 10_000) throw new Error('simulation did not settle');
      const head = pending[0];
      now = Math.max(now, head.readyAt);
      try {
        const result = (await processor.process({
          name: JOB_PURGE_ARTIST_EDGE_CACHE,
          data: { user_id: head.userId },
          timestamp: head.at,
        } as never)) as { purged: boolean; reason?: string };
        results.push({ userId: head.userId, at: now, reason: result.purged ? 'purged' : result.reason! });
        pending.shift();
      } catch (error) {
        if ((error as Error).message !== RATE_LIMIT_ERROR) throw error;
        // Stays at the front; the worker sleeps out the limit.
        now += rateLimitedFor;
      }
    }
    return { cloudflare, results, lastPurged };
  })();
};

/** A bulk upload or AI run: items finishing every `everyMs` (beyond the debounce window). */
const burst = (userId: number, count: number, everyMs: number, from = 0): Trigger[] =>
  Array.from({ length: count }, (_, i) => ({ userId, at: from + i * everyMs }));

describe('edge purge under a burst (virtual clock)', () => {
  afterEach(() => jest.restoreAllMocks());

  it("a burst for artist A does not delay artist B's purge beyond one rate-limit slot", async () => {
    // 20 items for A, 6 s apart (2 minutes), then B's bio edit 30 s in.
    const triggers = [...burst(ARTIST_A, 20, 6_000), { userId: ARTIST_B, at: 30_000 }];

    const { cloudflare } = await simulate(triggers);

    const bReadyAt = 30_000 + EDGE_PURGE_DEBOUNCE_MS;
    const bCall = cloudflare.find((call) => call.userId === ARTIST_B)!;
    expect(bCall).toBeDefined();
    // At most ONE Cloudflare call for A between B becoming ready and B's own call...
    const aCallsAhead = cloudflare.filter(
      (call) => call.userId === ARTIST_A && call.at >= bReadyAt && call.at <= bCall.at,
    );
    expect(aCallsAhead.length).toBeLessThanOrEqual(1);
    // ...so B waits at most until the next free slot, never behind A's whole backlog.
    expect(bCall.at - bReadyAt).toBeLessThanOrEqual(EDGE_PURGE_WINDOW_MS);
  });

  it("A's backlog collapses: covered jobs cost no Cloudflare call and no slot", async () => {
    const { cloudflare, results } = await simulate(burst(ARTIST_A, 20, 6_000));

    const aCalls = cloudflare.filter((call) => call.userId === ARTIST_A);
    // 20 triggers over 2 minutes; the old per-job limiter spent 20 calls on them.
    expect(aCalls.length).toBeLessThan(20);
    expect(results.filter((result) => result.reason === 'covered').length).toBeGreaterThan(0);
    // The rate is never exceeded in any 60 s window.
    for (const call of cloudflare) {
      const inWindow = cloudflare.filter((c) => c.at > call.at - EDGE_PURGE_WINDOW_MS && c.at <= call.at);
      expect(inWindow.length).toBeLessThanOrEqual(EDGE_PURGE_CALLS_PER_WINDOW);
    }
  });

  it('loses no trigger: every change ends up behind a purge that started after it', async () => {
    const triggers = [...burst(ARTIST_A, 20, 6_000), ...burst(ARTIST_B, 5, 7_000, 10_000)];

    const { lastPurged } = await simulate(triggers);

    for (const userId of [ARTIST_A, ARTIST_B]) {
      const lastTrigger = Math.max(...triggers.filter((t) => t.userId === userId).map((t) => t.at));
      expect(lastPurged.get(userId)).toBeGreaterThan(lastTrigger);
    }
  });

  it('a change made while the artist is being purged still gets a purge after it', async () => {
    // The first purge starts at 5 s and its Cloudflare call takes 3 s; the edit lands at 6 s,
    // while that purge is running.
    const { cloudflare, lastPurged } = await simulate(
      [
        { userId: ARTIST_A, at: 0 },
        { userId: ARTIST_A, at: 6_000 },
      ],
      { purgeTakesMs: 3_000 },
    );

    expect(cloudflare.filter((call) => call.userId === ARTIST_A)).toHaveLength(2);
    expect(lastPurged.get(ARTIST_A)).toBeGreaterThan(6_000);
  });
});
