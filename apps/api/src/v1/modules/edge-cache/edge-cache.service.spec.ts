import { UnrecoverableError } from 'bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import { EdgeCacheService, EdgePurgeTarget, MAX_PREFIXES_PER_REQUEST } from './edge-cache.service';
import { ArtistPublicPagesChangedEvent } from './events/artist-public-pages-changed.event';

/** Never a real token: the specs assert it never leaks into a message or a log line. */
const TOKEN = 'cf-test-token-should-never-be-logged';
const ZONE = 'zone-123';

const ENV_KEYS = ['NODE_ENV', 'APP_URL', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ZONE_ID'] as const;

const setEnv = (env: Partial<Record<(typeof ENV_KEYS)[number], string>>) => {
  for (const key of ENV_KEYS) {
    // Empty rather than deleted: `config()` re-reads the repo `.env`, and dotenv never overrides
    // a key that is already present.
    process.env[key] = env[key] ?? '';
  }
};

const productionEnv = {
  NODE_ENV: 'production',
  APP_URL: 'https://a11studio.com',
  CLOUDFLARE_API_TOKEN: TOKEN,
  CLOUDFLARE_ZONE_ID: ZONE,
};

const buildLogger = () => {
  const logger = {
    name: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    flushAsync: jest.fn(),
  };
  logger.name.mockReturnValue(logger);
  return logger;
};

const jsonResponse = (status: number, body: unknown) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as Response;

/** Every string a logger mock or an error received, to prove the token is in none of them. */
const everythingLogged = (logger: ReturnType<typeof buildLogger>) =>
  JSON.stringify([logger.info.mock.calls, logger.warn.mock.calls, logger.error.mock.calls]);

describe('EdgeCacheService', () => {
  const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  let logger: ReturnType<typeof buildLogger>;
  let service: EdgeCacheService;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    logger = buildLogger();
    service = new EdgeCacheService(logger as never);
    // Never the real Cloudflare API.
    fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('fetch must be stubbed per test');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  describe('purgeTarget (the gate)', () => {
    it('returns the canonical host, zone and token on production with both settings', () => {
      setEnv(productionEnv);

      expect(service.purgeTarget()).toEqual({ host: 'a11studio.com', zoneId: ZONE, token: TOKEN });
    });

    it('skips when NODE_ENV is not production', () => {
      setEnv({ ...productionEnv, NODE_ENV: 'development' });

      expect(service.purgeTarget()).toEqual({ skip: 'not canonical production origin' });
    });

    it('skips the dev host even in production mode', () => {
      setEnv({ ...productionEnv, APP_URL: 'https://dev.a11studio.com' });

      expect(service.purgeTarget()).toEqual({ skip: 'not canonical production origin' });
    });

    it('skips when APP_URL is missing or malformed', () => {
      setEnv({ ...productionEnv, APP_URL: 'not a url' });
      expect(service.purgeTarget()).toEqual({ skip: 'not canonical production origin' });

      setEnv({ ...productionEnv, APP_URL: '' });
      expect(service.purgeTarget()).toEqual({ skip: 'not canonical production origin' });
    });

    it('skips when the token is missing', () => {
      setEnv({ ...productionEnv, CLOUDFLARE_API_TOKEN: '' });

      expect(service.purgeTarget()).toEqual({ skip: 'CLOUDFLARE_API_TOKEN missing' });
    });

    it('skips when the zone is missing', () => {
      setEnv({ ...productionEnv, CLOUDFLARE_ZONE_ID: '' });

      expect(service.purgeTarget()).toEqual({ skip: 'CLOUDFLARE_ZONE_ID missing' });
    });
  });

  describe('buildPrefixes', () => {
    it('purges every locale with no scheme, no query and no trailing slash', () => {
      const { chunks, names, dropped } = service.buildPrefixes('a11studio.com', ['ana']);

      expect(chunks).toEqual([
        ['a11studio.com/artists/ana', 'a11studio.com/es/artists/ana', 'a11studio.com/pt/artists/ana'],
      ]);
      expect(names).toBe(1);
      expect(dropped).toBe(0);
      for (const prefix of chunks.flat()) {
        expect(prefix).not.toMatch(/^https?:|\/$|\?|\/en\//);
      }
    });

    it('lowercases and deduplicates names', () => {
      const { chunks, names } = service.buildPrefixes('a11studio.com', ['Ana', 'ana', ' ANA ', 'bob_1-x']);

      expect(names).toBe(2);
      expect(chunks.flat()).toEqual([
        'a11studio.com/artists/ana',
        'a11studio.com/es/artists/ana',
        'a11studio.com/pt/artists/ana',
        'a11studio.com/artists/bob_1-x',
        'a11studio.com/es/artists/bob_1-x',
        'a11studio.com/pt/artists/bob_1-x',
      ]);
    });

    it('drops anything that is not a username, and never sends it', () => {
      const { chunks, names, dropped } = service.buildPrefixes('a11studio.com', [
        'ana',
        '../admin',
        'a/b',
        'ana?x=1',
        '',
        'naïve',
        null,
        42,
      ]);

      expect(names).toBe(1);
      expect(dropped).toBe(7);
      expect(chunks.flat()).toHaveLength(3);
    });

    it(`chunks at ${MAX_PREFIXES_PER_REQUEST} prefixes per request`, () => {
      const many = Array.from({ length: 40 }, (_, i) => `artist${i}`);

      const { chunks } = service.buildPrefixes('a11studio.com', many);

      expect(chunks.map((chunk) => chunk.length)).toEqual([100, 20]);
    });

    it('returns no chunk for no valid name', () => {
      expect(service.buildPrefixes('a11studio.com', ['%%']).chunks).toEqual([]);
    });
  });

  describe('purgePrefixes', () => {
    const target: EdgePurgeTarget = { host: 'a11studio.com', zoneId: ZONE, token: TOKEN };
    const prefixes = ['a11studio.com/artists/ana'];

    it('POSTs the prefixes to the zone purge endpoint with the bearer token', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { success: true, errors: [] }));

      await expect(service.purgePrefixes(target, prefixes)).resolves.toBeUndefined();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [
        string,
        { method: string; headers: Record<string, string>; body: string; signal: AbortSignal },
      ];
      expect(url).toBe(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`);
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      expect(JSON.parse(init.body)).toEqual({ prefixes });
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it.each([429, 500, 502, 503])('throws a retryable error on HTTP %i', async (status: number) => {
      fetchMock.mockResolvedValue(jsonResponse(status, { success: false, errors: [{ code: 10000 }] }));

      const error = await service.purgePrefixes(target, prefixes).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(UnrecoverableError);
      expect((error as Error).message).toContain(`HTTP ${status}`);
    });

    it('throws a retryable error on a timeout', async () => {
      fetchMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'TimeoutError' }));

      const error = await service.purgePrefixes(target, prefixes).catch((e: unknown) => e);

      expect(error).not.toBeInstanceOf(UnrecoverableError);
      expect((error as Error).message).toContain('timed out');
    });

    it('throws a retryable error on a network failure, without its cause', async () => {
      fetchMock.mockRejectedValue(new TypeError(`fetch failed Bearer ${TOKEN}`));

      const error = await service.purgePrefixes(target, prefixes).catch((e: unknown) => e);

      expect(error).not.toBeInstanceOf(UnrecoverableError);
      expect((error as Error).message).toContain('network error');
      expect((error as Error).message).not.toContain(TOKEN);
    });

    it.each([400, 401, 403])(
      'throws UnrecoverableError on HTTP %i and logs the status and error codes',
      async (status: number) => {
        fetchMock.mockResolvedValue(
          jsonResponse(status, { success: false, errors: [{ code: 10000 }, { code: 1012 }] }),
        );

        const error = await service.purgePrefixes(target, prefixes).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(UnrecoverableError);
        expect((error as Error).message).toContain(`HTTP ${status}`);
        expect((error as Error).message).toContain('10000,1012');
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(`HTTP ${status}`));
      },
    );

    it('throws UnrecoverableError on a 200 without success: true', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { success: false, errors: [{ code: 1134 }] }));

      const error = await service.purgePrefixes(target, prefixes).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnrecoverableError);
      expect((error as Error).message).toContain('1134');
    });

    it('throws UnrecoverableError on a 200 whose body is not JSON', async () => {
      fetchMock.mockResolvedValue({
        status: 200,
        ok: true,
        json: jest.fn().mockRejectedValue(new SyntaxError('bad json')),
      } as unknown as Response);

      await expect(service.purgePrefixes(target, prefixes)).rejects.toBeInstanceOf(UnrecoverableError);
    });

    it('never puts the token in an error or a log line', async () => {
      const outcomes = [
        jsonResponse(200, { success: true }),
        jsonResponse(429, {}),
        jsonResponse(500, {}),
        jsonResponse(401, { success: false, errors: [{ code: 10000 }] }),
        jsonResponse(200, { success: false }),
      ];
      const messages: string[] = [];
      for (const outcome of outcomes) {
        fetchMock.mockResolvedValueOnce(outcome);
        await service.purgePrefixes(target, prefixes).catch((e: Error) => messages.push(e.message));
      }

      expect(messages).toHaveLength(4);
      expect(messages.join('\n')).not.toContain(TOKEN);
      expect(everythingLogged(logger)).not.toContain(TOKEN);
    });
  });

  describe('handleArtistPublicPagesChanged (the listener)', () => {
    it('enqueues a debounced purge job for the user', async () => {
      const enqueue = jest
        .spyOn(QueueHelper, 'createPurgeArtistEdgeCacheJob')
        .mockResolvedValue(undefined);

      await service.handleArtistPublicPagesChanged(new ArtistPublicPagesChangedEvent(7));

      expect(enqueue).toHaveBeenCalledWith({ user_id: 7 });
    });

    it('passes the payload names through', async () => {
      const enqueue = jest
        .spyOn(QueueHelper, 'createPurgeArtistEdgeCacheJob')
        .mockResolvedValue(undefined);

      await service.handleArtistPublicPagesChanged(
        new ArtistPublicPagesChangedEvent(7, ['old', 'new']),
      );

      expect(enqueue).toHaveBeenCalledWith({ user_id: 7, usernames: ['old', 'new'] });
    });

    it('swallows and logs an enqueue failure, so the request that changed the page still succeeds', async () => {
      jest
        .spyOn(QueueHelper, 'createPurgeArtistEdgeCacheJob')
        .mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:6379'));
      const flush = jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);

      await expect(
        service.handleArtistPublicPagesChanged(new ArtistPublicPagesChangedEvent(7)),
      ).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('user [7]'));
      // In-process, not through the log queue that needs the Redis that just failed.
      expect(flush).toHaveBeenCalled();
      expect(logger.flushAsync).not.toHaveBeenCalled();
    });
  });
});
