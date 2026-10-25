import { HttpException, HttpStatus } from '@nestjs/common';
import { RATE_LIMIT_ERROR, UnrecoverableError } from 'bullmq';
import { EDGE_HTML_MAX_STALE_MS } from '@repo/common-lib/constants/edge-cache';
import { EDGE_CACHE_QUEUE, JOB_PURGE_ARTIST_EDGE_CACHE } from '@repo/common-lib/constants/queues';
import { EDGE_PURGE_COVER_SKEW_MS, EdgeCacheProcessor } from './edge-cache.processor';
import { EdgeCacheService, EdgePurgeTarget } from './edge-cache.service';

/** `@nestjs/bullmq`'s metadata keys (not exported from the package root). */
const PROCESSOR_METADATA = 'bullmq:processor_metadata';
const WORKER_METADATA = 'bullmq:worker_metadata';

const TOKEN = 'cf-test-token-should-never-be-logged';
const TARGET: EdgePurgeTarget = { host: 'a11studio.com', zoneId: 'zone-123', token: TOKEN };

const buildLogger = () => {
  const logger = {
    name: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    flushAsync: jest.fn().mockResolvedValue(undefined),
  };
  logger.name.mockReturnValue(logger);
  return logger;
};

const build = ({
  target = TARGET as EdgePurgeTarget | { skip: string },
  current = 'ana' as string | null,
  reserved = [] as string[],
  lastPurgedAt = null as number | null,
  slot = { ok: true } as { ok: true } | { ok: false; retryInMs: number },
} = {}) => {
  const logger = buildLogger();
  // The real prefix builder: the processor's output shape is what is under test.
  const edgeCacheService = new EdgeCacheService(logger as never);
  jest.spyOn(edgeCacheService, 'purgeTarget').mockReturnValue(target);
  const purgePrefixes = jest.spyOn(edgeCacheService, 'purgePrefixes').mockResolvedValue(undefined);
  const userRepository = {
    findByIdCompact: jest.fn(async () => {
      if (current === null) {
        throw new HttpException('User not found with id 7', HttpStatus.NOT_FOUND);
      }
      return { id: 7, username: current };
    }),
  };
  const usernameHistoryRepository = { findReservedByUser: jest.fn().mockResolvedValue(reserved) };
  const ledger = {
    lastPurgedAt: jest.fn().mockResolvedValue(lastPurgedAt),
    markPurged: jest.fn().mockResolvedValue(undefined),
    takeSlots: jest.fn().mockResolvedValue(slot),
  };
  const queue = { rateLimit: jest.fn().mockResolvedValue(undefined) };
  const processor = new EdgeCacheProcessor(
    edgeCacheService,
    userRepository as never,
    usernameHistoryRepository as never,
    logger as never,
    ledger as never,
    queue as never,
  );
  return { processor, purgePrefixes, userRepository, usernameHistoryRepository, logger, ledger, queue };
};

const job = (data: object, { name = JOB_PURGE_ARTIST_EDGE_CACHE, ageMs = 5_000 } = {}) =>
  ({ name, data: { user_id: 7, ...data }, timestamp: Date.now() - ageMs }) as never;

const sentPrefixes = (purgePrefixes: jest.SpyInstance) =>
  purgePrefixes.mock.calls.flatMap(([, prefixes]) => prefixes as string[]);

describe('EdgeCacheProcessor', () => {
  afterEach(() => jest.restoreAllMocks());

  it('is registered on the edge-cache queue, one job at a time, with no per-job limiter', () => {
    expect(Reflect.getMetadata(PROCESSOR_METADATA, EdgeCacheProcessor)).toEqual({
      name: EDGE_CACHE_QUEUE,
    });
    // A BullMQ limiter would count skipped jobs too; the rate is on real Cloudflare calls only.
    expect(Reflect.getMetadata(WORKER_METADATA, EdgeCacheProcessor)).toEqual({ concurrency: 1 });
  });

  it('throws on an unknown job name, and still flushes the logs', async () => {
    const { processor, logger } = build();

    await expect(processor.process(job({}, { name: 'nope' }))).rejects.toThrow('not recognized');
    expect(logger.flushAsync).toHaveBeenCalled();
  });

  describe('the gate', () => {
    it.each(['not canonical production origin', 'CLOUDFLARE_API_TOKEN missing', 'CLOUDFLARE_ZONE_ID missing'])(
      'completes without calling Cloudflare and logs the reason: %s',
      async (reason) => {
        const { processor, purgePrefixes, userRepository, logger } = build({ target: { skip: reason } });

        await expect(processor.process(job({}))).resolves.toEqual({ purged: false, reason });

        expect(purgePrefixes).not.toHaveBeenCalled();
        // Not even the lookups: a skipped job costs nothing on dev.
        expect(userRepository.findByIdCompact).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledTimes(1);
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(reason));
      },
    );
  });

  it('drops a job older than the edge TTL without calling Cloudflare or taking a slot', async () => {
    const { processor, purgePrefixes, userRepository, ledger } = build();

    await expect(
      processor.process(job({}, { ageMs: EDGE_HTML_MAX_STALE_MS + 1_000 })),
    ).resolves.toEqual({ purged: false, reason: 'stale' });

    expect(purgePrefixes).not.toHaveBeenCalled();
    expect(userRepository.findByIdCompact).not.toHaveBeenCalled();
    expect(ledger.takeSlots).not.toHaveBeenCalled();
  });

  describe('coalescing by the last purge', () => {
    it('skips, for free, a job whose trigger came before the last purge of the artist started', async () => {
      const triggeredAt = Date.now() - 20_000;
      const { processor, purgePrefixes, userRepository, ledger } = build({
        lastPurgedAt: triggeredAt + EDGE_PURGE_COVER_SKEW_MS,
      });

      jest.spyOn(Date, 'now').mockReturnValue(triggeredAt + 20_000);
      await expect(processor.process(job({}, { ageMs: 20_000 }))).resolves.toEqual({
        purged: false,
        reason: 'covered',
      });

      expect(ledger.lastPurgedAt).toHaveBeenCalledWith(7);
      expect(purgePrefixes).not.toHaveBeenCalled();
      expect(userRepository.findByIdCompact).not.toHaveBeenCalled();
      expect(ledger.takeSlots).not.toHaveBeenCalled();
    });

    it('still purges a trigger inside the clock-skew margin of the last purge', async () => {
      const triggeredAt = Date.now() - 20_000;
      const { processor, purgePrefixes } = build({
        lastPurgedAt: triggeredAt + EDGE_PURGE_COVER_SKEW_MS - 1,
      });

      // `job()` stamps `Date.now() - ageMs` itself; pin the clock so both sides agree.
      jest.spyOn(Date, 'now').mockReturnValue(triggeredAt + 20_000);
      await processor.process(job({}, { ageMs: 20_000 }));

      expect(purgePrefixes).toHaveBeenCalledTimes(1);
    });

    it('stamps the artist with the time taken BEFORE the names were read, after Cloudflare said yes', async () => {
      const { processor, purgePrefixes, userRepository, ledger } = build();
      const before = Date.now();

      await processor.process(job({}));

      expect(ledger.markPurged).toHaveBeenCalledTimes(1);
      const [userId, startedAt] = ledger.markPurged.mock.calls[0];
      expect(userId).toBe(7);
      expect(startedAt).toBeGreaterThanOrEqual(before);
      expect(startedAt).toBeLessThanOrEqual(Date.now());
      expect(ledger.markPurged.mock.invocationCallOrder[0]).toBeGreaterThan(
        purgePrefixes.mock.invocationCallOrder[0],
      );
      // A trigger landing while this purge runs is newer than the stamp, so it is purged again.
      expect(userRepository.findByIdCompact.mock.invocationCallOrder[0]).toBeGreaterThan(
        ledger.lastPurgedAt.mock.invocationCallOrder[0],
      );
    });

    it('does not stamp when the purge failed, so the retry is not mistaken for covered', async () => {
      const { processor, purgePrefixes, ledger } = build();
      purgePrefixes.mockRejectedValue(new Error('Cloudflare purge failed, will retry (HTTP 500)'));

      await expect(processor.process(job({}))).rejects.toThrow('HTTP 500');
      expect(ledger.markPurged).not.toHaveBeenCalled();
    });
  });

  describe('the rate limit (real Cloudflare calls only)', () => {
    it('takes one slot per request before calling Cloudflare', async () => {
      const { processor, purgePrefixes, ledger } = build();

      await processor.process(job({}));

      expect(ledger.takeSlots).toHaveBeenCalledWith(1);
      expect(ledger.takeSlots.mock.invocationCallOrder[0]).toBeLessThan(
        purgePrefixes.mock.invocationCallOrder[0],
      );
    });

    it('with no slot free: rate-limits the queue and hands the job back without spending an attempt', async () => {
      const { processor, purgePrefixes, ledger, queue } = build({
        slot: { ok: false, retryInMs: 12_345 },
      });

      const error = await processor.process(job({})).catch((e: unknown) => e);

      // The error BullMQ's worker recognises: back to the front of the wait list, attempt not counted.
      expect((error as Error).message).toBe(RATE_LIMIT_ERROR);
      expect(queue.rateLimit).toHaveBeenCalledWith(12_345);
      expect(purgePrefixes).not.toHaveBeenCalled();
      expect(ledger.markPurged).not.toHaveBeenCalled();
    });
  });

  it('still purges a job just inside the edge TTL', async () => {
    const { processor, purgePrefixes } = build();

    await processor.process(job({}, { ageMs: EDGE_HTML_MAX_STALE_MS - 1_000 }));

    expect(purgePrefixes).toHaveBeenCalledTimes(1);
  });

  describe('name resolution', () => {
    it('purges payload ∪ current ∪ still-reserved names, every locale, in one request', async () => {
      const { processor, purgePrefixes, usernameHistoryRepository } = build({
        current: 'new-name',
        reserved: ['old-name', 'older'],
      });

      await expect(processor.process(job({ usernames: ['from-payload', 'new-name'] }))).resolves.toEqual({
        purged: true,
        names: 4,
        prefixes: 12,
        requests: 1,
      });

      expect(usernameHistoryRepository.findReservedByUser).toHaveBeenCalledWith(7);
      expect(purgePrefixes).toHaveBeenCalledTimes(1);
      expect(purgePrefixes.mock.calls[0][0]).toBe(TARGET);
      expect(sentPrefixes(purgePrefixes).sort()).toEqual(
        ['from-payload', 'new-name', 'old-name', 'older']
          .flatMap((name) => [
            `a11studio.com/artists/${name}`,
            `a11studio.com/es/artists/${name}`,
            `a11studio.com/pt/artists/${name}`,
          ])
          .sort(),
      );
    });

    it('purges both names of a rename', async () => {
      const { processor, purgePrefixes } = build({ current: 'new', reserved: ['old'] });

      await processor.process(job({ usernames: ['old', 'new'] }));

      expect(sentPrefixes(purgePrefixes)).toEqual(
        expect.arrayContaining(['a11studio.com/es/artists/old', 'a11studio.com/pt/artists/new']),
      );
      expect(sentPrefixes(purgePrefixes)).toHaveLength(6);
    });

    it('relies on the payload once the account is hard-deleted', async () => {
      const { processor, purgePrefixes } = build({ current: null, reserved: [] });

      await processor.process(job({ usernames: ['gone'] }));

      expect(sentPrefixes(purgePrefixes)).toEqual([
        'a11studio.com/artists/gone',
        'a11studio.com/es/artists/gone',
        'a11studio.com/pt/artists/gone',
      ]);
    });

    it('completes without a request when there is no name at all', async () => {
      const { processor, purgePrefixes } = build({ current: null });

      await expect(processor.process(job({}))).resolves.toEqual({
        purged: false,
        reason: 'no usernames',
      });
      expect(purgePrefixes).not.toHaveBeenCalled();
    });

    it('never sends an invalid name, and warns about it', async () => {
      const { processor, purgePrefixes, logger } = build({ current: 'ana' });

      await processor.process(job({ usernames: ['../x', 'a b'] }));

      expect(sentPrefixes(purgePrefixes)).toHaveLength(3);
      expect(sentPrefixes(purgePrefixes).join()).not.toMatch(/\.\.|a b/);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('dropped 2'));
    });

    it('rethrows a lookup failure other than "not found", so the job is retried', async () => {
      const { processor, userRepository, purgePrefixes } = build();
      userRepository.findByIdCompact.mockRejectedValue(new Error('pool exhausted'));

      await expect(processor.process(job({}))).rejects.toThrow('pool exhausted');
      expect(purgePrefixes).not.toHaveBeenCalled();
    });
  });

  describe('failures', () => {
    it('rethrows a retryable error so BullMQ backs off and tries again', async () => {
      const { processor, purgePrefixes, logger } = build();
      purgePrefixes.mockRejectedValue(new Error('Cloudflare purge failed, will retry (HTTP 429)'));

      await expect(processor.process(job({}))).rejects.toThrow('HTTP 429');
      expect(logger.flushAsync).toHaveBeenCalled();
    });

    it('rethrows an UnrecoverableError as is, so BullMQ does not retry it', async () => {
      const { processor, purgePrefixes } = build();
      purgePrefixes.mockRejectedValue(new UnrecoverableError('Cloudflare purge rejected (HTTP 403)'));

      await expect(processor.process(job({}))).rejects.toBeInstanceOf(UnrecoverableError);
    });
  });

  it('logs counts only: never the token', async () => {
    const { processor, logger } = build({ reserved: ['old'] });

    await processor.process(job({}));

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringMatching(/2 username\(s\), 6 prefixes, 1 request\(s\)/),
    );
    const logged = JSON.stringify([logger.info.mock.calls, logger.warn.mock.calls, logger.error.mock.calls]);
    expect(logged).not.toContain(TOKEN);
  });
});
