// `media.processor` imports `media.service` -> `users.service`, which builds a Stripe client at import time.
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import { HttpException, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnrecoverableError } from 'bullmq';
import { QueueHelper } from '@repo/backend-lib/utils';
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from '@repo/common-lib/constants/events';
import { JOB_PURGE_ARTIST_EDGE_CACHE, JOB_UPDATE_MEDIA } from '@repo/common-lib/constants/queues';
import { MediaProcessor } from '../media/media.processor';
import { EdgeCacheProcessor } from './edge-cache.processor';
import { EdgeCacheService } from './edge-cache.service';
import { ArtistPublicPagesChangedEvent } from './events/artist-public-pages-changed.event';

/**
 * Black-box acceptance checks built from the plan (AC-17..AC-19), wiring the REAL service and
 * processor together. Only the boundaries are stubbed: `fetch` (never the real Cloudflare API),
 * the repositories and the queue helper.
 */
const TOKEN = 'cf-acceptance-token-never-in-logs';
const ZONE = 'zone-acceptance';
const ENV_KEYS = ['NODE_ENV', 'APP_URL', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ZONE_ID'] as const;
type Env = Partial<Record<(typeof ENV_KEYS)[number], string>>;

const PROD: Env = {
  NODE_ENV: 'production',
  APP_URL: 'https://a11studio.com',
  CLOUDFLARE_API_TOKEN: TOKEN,
  CLOUDFLARE_ZONE_ID: ZONE,
};

const setEnv = (env: Env) => {
  for (const key of ENV_KEYS) process.env[key] = env[key] ?? '';
};

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

const everythingLogged = (logger: ReturnType<typeof buildLogger>) =>
  JSON.stringify([logger.info.mock.calls, logger.warn.mock.calls, logger.error.mock.calls]);

const cfResponse = (status: number, body: unknown = { success: status < 300, errors: [] }) =>
  ({ status, ok: status < 300, json: jest.fn().mockResolvedValue(body) }) as unknown as Response;

const build = ({ current = 'ana', reserved = [] as string[] } = {}) => {
  const logger = buildLogger();
  const service = new EdgeCacheService(logger as never);
  const userRepository = {
    findByIdCompact: jest.fn(async () => {
      if (current === null) throw new HttpException('nf', HttpStatus.NOT_FOUND);
      return { id: 7, username: current };
    }),
  };
  const history = { findReservedByUser: jest.fn().mockResolvedValue(reserved) };
  // No earlier purge of this artist and a free rate slot (the Redis ledger is covered by
  // `edge-purge-ledger.redis.spec.ts`; coalescing and the rate by `edge-cache.burst.spec.ts`).
  const ledger = {
    lastPurgedAt: jest.fn().mockResolvedValue(null),
    markPurged: jest.fn().mockResolvedValue(undefined),
    takeSlots: jest.fn().mockResolvedValue({ ok: true }),
  };
  const queue = { rateLimit: jest.fn() };
  const processor = new EdgeCacheProcessor(
    service,
    userRepository as never,
    history as never,
    logger as never,
    ledger as never,
    queue as never,
  );
  return { processor, logger, userRepository, history };
};

const job = (data: object = {}, ageMs = 1_000) =>
  ({ name: JOB_PURGE_ARTIST_EDGE_CACHE, data: { user_id: 7, ...data }, timestamp: Date.now() - ageMs }) as never;

describe('edge purge acceptance (service + processor together)', () => {
  const saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('fetch must be stubbed per test');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  describe('AC-18 the gate holds end to end', () => {
    const closed: [string, Env, string][] = [
      ['NODE_ENV is not production', { ...PROD, NODE_ENV: 'development' }, 'not canonical production origin'],
      ['APP_URL is the dev host', { ...PROD, APP_URL: 'https://dev.a11studio.com' }, 'not canonical production origin'],
      ['APP_URL is www', { ...PROD, APP_URL: 'https://www.a11studio.com' }, 'not canonical production origin'],
      ['APP_URL is a lookalike suffix', { ...PROD, APP_URL: 'https://a11studio.com.evil.example' }, 'not canonical production origin'],
      ['APP_URL is a lookalike prefix', { ...PROD, APP_URL: 'https://evil-a11studio.com' }, 'not canonical production origin'],
      ['APP_URL carries a port', { ...PROD, APP_URL: 'https://a11studio.com:8443' }, 'not canonical production origin'],
      ['APP_URL is localhost', { ...PROD, APP_URL: 'http://localhost:3000' }, 'not canonical production origin'],
      ['APP_URL is empty', { ...PROD, APP_URL: '' }, 'not canonical production origin'],
      ['APP_URL is malformed', { ...PROD, APP_URL: 'not a url' }, 'not canonical production origin'],
      ['token is empty', { ...PROD, CLOUDFLARE_API_TOKEN: '' }, 'CLOUDFLARE_API_TOKEN missing'],
      ['zone is empty', { ...PROD, CLOUDFLARE_ZONE_ID: '' }, 'CLOUDFLARE_ZONE_ID missing'],
    ];

    it.each(closed)(
      'AC-18: no HTTP call when %s; one log line names the reason',
      async (_label: string, env: Env, reason: string) => {
        setEnv(env);
        const { processor, logger, userRepository } = build();

        await expect(processor.process(job({ usernames: ['ana'] }))).resolves.toEqual({
          purged: false,
          reason,
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(userRepository.findByIdCompact).not.toHaveBeenCalled();
        const lines = [...logger.info.mock.calls, ...logger.warn.mock.calls, ...logger.error.mock.calls];
        expect(lines).toHaveLength(1);
        expect(String(lines[0][0])).toContain(reason);
        expect(everythingLogged(logger)).not.toContain(TOKEN);
      },
    );

    it('AC-18: production with both settings does reach Cloudflare, with the token only in the header', async () => {
      setEnv(PROD);
      fetchMock.mockResolvedValue(cfResponse(200));
      const { processor, logger } = build();

      await processor.process(job());

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
      expect(url).toBe(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`);
      expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      expect(init.body).not.toContain(TOKEN);
      expect(everythingLogged(logger)).not.toContain(TOKEN);
    });
  });

  describe('AC-17 request shape through the processor', () => {
    it('AC-17: one request; payload U current U reserved; 3 locales; no scheme, slash or query; invalid dropped', async () => {
      setEnv(PROD);
      fetchMock.mockResolvedValue(cfResponse(200));
      const { processor } = build({ current: 'newname', reserved: ['oldname', 'NewName'] });

      await processor.process(job({ usernames: ['oldname', 'Bad Name', '../x', 'a/b', 'ok_1-x', ''] }));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body) as { prefixes: string[] };
      expect(Object.keys(body)).toEqual(['prefixes']);
      expect([...body.prefixes].sort()).toEqual(
        ['newname', 'oldname', 'ok_1-x']
          .flatMap((n) => [`a11studio.com/artists/${n}`, `a11studio.com/es/artists/${n}`, `a11studio.com/pt/artists/${n}`])
          .sort(),
      );
      for (const prefix of body.prefixes) {
        expect(prefix).not.toMatch(/^https?:/);
        expect(prefix).not.toMatch(/\/$/);
        expect(prefix).not.toContain('?');
        expect(prefix).not.toContain('/en/');
      }
    });

    it('AC-17: more than 100 prefixes are split into requests of at most 100', async () => {
      setEnv(PROD);
      fetchMock.mockResolvedValue(cfResponse(200));
      const { processor } = build({ current: 'ana' });
      const names = Array.from({ length: 60 }, (_, i) => `artist${i}`);

      await processor.process(job({ usernames: names }));

      const sizes = fetchMock.mock.calls.map(
        (call) => (JSON.parse((call[1] as { body: string }).body) as { prefixes: string[] }).prefixes.length,
      );
      expect(sizes.every((size) => size <= 100)).toBe(true);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(61 * 3);
      expect(sizes.length).toBe(2);
    });
  });

  describe('AC-19 failures are isolated', () => {
    it.each([429, 500, 503])('AC-19: HTTP %i rethrows a retryable error (BullMQ retries)', async (status: number) => {
      setEnv(PROD);
      fetchMock.mockResolvedValue(cfResponse(status));
      const { processor, logger } = build();

      const error = await processor.process(job()).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(UnrecoverableError);
      expect(everythingLogged(logger) + (error as Error).message).not.toContain(TOKEN);
    });

    it.each([400, 401, 403])('AC-19: HTTP %i is unrecoverable and logged with status and codes', async (status: number) => {
      setEnv(PROD);
      fetchMock.mockResolvedValue(cfResponse(status, { success: false, errors: [{ code: 9109 }] }));
      const { processor, logger } = build();

      const error = await processor.process(job()).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnrecoverableError);
      expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`${status}.*9109`)));
      expect(everythingLogged(logger)).not.toContain(TOKEN);
    });

    it('AC-19: 200 with success:false is unrecoverable', async () => {
      setEnv(PROD);
      fetchMock.mockResolvedValue(cfResponse(200, { success: false, errors: [{ code: 1 }] }));
      const { processor } = build();

      await expect(processor.process(job())).rejects.toBeInstanceOf(UnrecoverableError);
    });

    it('AC-19: a job older than 360 s completes without calling Cloudflare, even in production', async () => {
      setEnv(PROD);
      const { processor } = build();

      await expect(processor.process(job({}, 360_001))).resolves.toEqual({ purged: false, reason: 'stale' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('AC-19: the real @OnEvent listener is wired to the event name and a Redis failure never reaches the emitter', async () => {
      const logger = buildLogger();
      const service = new EdgeCacheService(logger as never);
      const enqueue = jest.spyOn(QueueHelper, 'createPurgeArtistEdgeCacheJob').mockRejectedValue(new Error('redis down'));
      const emitter = new EventEmitter2();
      emitter.on(ARTIST_PUBLIC_PAGES_CHANGED_EVENT, (event: ArtistPublicPagesChangedEvent) =>
        service.handleArtistPublicPagesChanged(event),
      );

      // The decorator metadata must name the same event the triggers emit.
      const keys = Reflect.getMetadataKeys(EdgeCacheService.prototype.handleArtistPublicPagesChanged);
      const meta = keys.map((k) => Reflect.getMetadata(k, EdgeCacheService.prototype.handleArtistPublicPagesChanged));
      expect(JSON.stringify(meta)).toContain(ARTIST_PUBLIC_PAGES_CHANGED_EVENT);

      await expect(
        emitter.emitAsync(ARTIST_PUBLIC_PAGES_CHANGED_EVENT, new ArtistPublicPagesChangedEvent(7, ['ana'])),
      ).resolves.toBeDefined();
      expect(enqueue).toHaveBeenCalledWith({ user_id: 7, usernames: ['ana'] });
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('redis down'));
    });
  });

  describe('AC-16 async completion triggers', () => {
    it('AC-16: JOB_UPDATE_MEDIA emits for the owner after success, and not after a failure', async () => {
      jest.spyOn(QueueHelper, 'createOrUpdateUserNotificationJob').mockResolvedValue(undefined as never);
      const emitter = { emit: jest.fn() };
      const mediaService = { updateForUser: jest.fn() };
      const mediaRepository = { restoreStatus: jest.fn().mockResolvedValue(undefined) };
      const logger = buildLogger();
      const processor = new MediaProcessor(mediaService as never, mediaRepository as never, logger as never, emitter as never);

      mediaService.updateForUser.mockResolvedValue({ id: 5 });
      await processor.process({ name: JOB_UPDATE_MEDIA, data: { media_id: 5, user_id: 7, data: {} } } as never);
      expect(emitter.emit).toHaveBeenCalledTimes(1);
      expect(emitter.emit).toHaveBeenCalledWith(
        ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
        expect.objectContaining({ userId: 7 }),
      );

      emitter.emit.mockClear();
      mediaService.updateForUser.mockRejectedValue(new Error('boom'));
      await expect(
        processor.process({ name: JOB_UPDATE_MEDIA, data: { media_id: 5, user_id: 7, data: {} } } as never),
      ).rejects.toThrow('boom');
      expect(emitter.emit).not.toHaveBeenCalled();
    });
  });
});
