import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logService } from '@repo/backend-lib/config/logging';
import { API_ERRORS } from '@repo/common-lib/constants/api-errors';
import {
  TURNSTILE_ACTIONS,
  TURNSTILE_SITEVERIFY_URL,
  TURNSTILE_TEST_KEYS,
  TURNSTILE_TEST_SECRET_KEY,
} from '@repo/common-lib/constants/turnstile';
import { ApiException } from 'src/common/exceptions/api-exception';
import { consoleLogger } from 'src/common/testing/console-logger';
import { RequestService } from './request.service';
import { resolveTurnstileConfig, TurnstileService } from './turnstile.service';

const TOKEN = 'XXXX.SECRETWIDGETTOKEN.XXXX';
const SECRET = 'real-secret-SECRETVALUE-0001';
const SITE = 'real-site-SITEVALUE-0001';
const IP = '203.0.113.77';
const APP_HOST = 'a11studio.com';
const SIGNUP = TURNSTILE_ACTIONS.SIGNUP;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Env = { isProduction: boolean; secretKey?: string; siteKey?: string; appUrl?: string };

const PROD: Env = { isProduction: true, secretKey: SECRET, siteKey: SITE, appUrl: `https://${APP_HOST}` };
const LOCAL_REAL: Env = { isProduction: false, secretKey: SECRET, siteKey: SITE, appUrl: `https://${APP_HOST}` };
const LOCAL_UNSET: Env = { isProduction: false, appUrl: 'http://localhost:3000' };

let lines: any[] = [];
let fetchMock: jest.Mock;
/** The real global `fetch`, put back after every test so no other suite sees the mock. */
const originalFetch = global.fetch;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const ok = (over: Record<string, unknown> = {}) =>
  json({ success: true, 'error-codes': [], hostname: APP_HOST, action: SIGNUP, ...over });
const rejected = (codes: string[], status = 200) => json({ success: false, 'error-codes': codes }, status);
const timeoutError = () => Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });

const configFor = (env: Env) => {
  const values: Record<string, unknown> = {
    'app.isProduction': env.isProduction,
    'app.url': env.appUrl,
    'turnstile.secretKey': env.secretKey ?? '',
    'turnstile.siteKey': env.siteKey ?? '',
  };
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService;
};

const build = (env: Env, ipAddress: string | null = IP) => {
  const requestService = {
    ip_address: ipAddress,
    log: (channel: string, { operation }: { operation?: string } = {}) =>
      consoleLogger({ defaultOptions: operation ? { channel, operation } : { channel } } as any),
  } as unknown as RequestService;
  const service = new TurnstileService(configFor(env), requestService);
  service.onModuleInit();
  return service;
};

const turnstileLines = () => lines.filter((l) => l.operation === 'turnstile-verify');
const sentBody = (call = 0) => new URLSearchParams(String(fetchMock.mock.calls[call][1].body));

const expectApiError = async (promise: Promise<unknown>, code: string, status: number) => {
  const error = await promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiException);
  expect((error as ApiException).API_ERROR_CODE).toBe(code);
  expect((error as ApiException).getStatus()).toBe(status);
};
const expect403 = (p: Promise<unknown>) => expectApiError(p, API_ERRORS.TURNSTILE_FAILED, HttpStatus.FORBIDDEN);
const expect503 = (p: Promise<unknown>) => expectApiError(p, API_ERRORS.TURNSTILE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE);

const expectNoSecretsLogged = () => {
  const dumped = JSON.stringify(lines);
  for (const secret of [TOKEN, SECRET, IP, TURNSTILE_TEST_SECRET_KEY]) expect(dumped).not.toContain(secret);
  for (let i = 0; i < fetchMock.mock.calls.length; i++) {
    const key = sentBody(i).get('idempotency_key');
    if (key) expect(dumped).not.toContain(key);
  }
};

beforeEach(() => {
  lines = [];
  for (const method of ['log', 'warn', 'error', 'debug'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try {
        lines.push(JSON.parse(String(line)));
      } catch {
        /* not a log line */
      }
    });
  }
  jest.spyOn(logService, 'api').mockImplementation((cfg = {}) => consoleLogger(cfg));
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('resolveTurnstileConfig', () => {
  it('AC-10: production with a valid config resolves the APP_URL hostname and the real secret', () => {
    expect(resolveTurnstileConfig({ ...PROD, secretKey: SECRET, siteKey: SITE, appUrl: PROD.appUrl })).toEqual({
      secretKey: SECRET,
      expectedHostname: APP_HOST,
      usingTestKey: false,
    });
  });

  it.each([
    ['unset', ''],
    ['blank', '   '],
  ])('AC-10: production refuses a %s TURNSTILE_SECRET_KEY, naming the variable', (_n, secretKey) => {
    expect(() => resolveTurnstileConfig({ isProduction: true, secretKey, siteKey: SITE, appUrl: PROD.appUrl })).toThrow(
      /TURNSTILE_SECRET_KEY/,
    );
  });

  it.each([
    ['unset', ''],
    ['blank', '   '],
  ])('AC-10: production refuses a %s site key, naming TURNSTILE_SITE_KEY (override 2)', (_n, siteKey) => {
    let message = '';
    try {
      resolveTurnstileConfig({ isProduction: true, secretKey: SECRET, siteKey, appUrl: PROD.appUrl });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/\bTURNSTILE_SITE_KEY\b/);
    expect(message).not.toMatch(/NEXT_PUBLIC_/);
    expect(message).not.toContain(SECRET);
  });

  it.each([...TURNSTILE_TEST_KEYS])('AC-10: production refuses the Cloudflare test key %s as secret or site key, without echoing it', (testKey) => {
    for (const input of [
      { secretKey: testKey, siteKey: SITE, varName: /TURNSTILE_SECRET_KEY/ },
      { secretKey: SECRET, siteKey: testKey, varName: /TURNSTILE_SITE_KEY/ },
    ]) {
      let error: Error | null = null;
      try {
        resolveTurnstileConfig({ isProduction: true, secretKey: input.secretKey, siteKey: input.siteKey, appUrl: PROD.appUrl });
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeInstanceOf(Error);
      expect(error!.message).toMatch(input.varName);
      expect(error!.message).not.toContain(testKey);
      expect(error!.message).not.toContain(SECRET);
      expect(error!.message).not.toContain(SITE);
    }
  });

  it.each([
    ['unset', undefined],
    ['not a URL', 'a11studio'],
    ['localhost', 'http://localhost:3000'],
    ['127.0.0.1', 'http://127.0.0.1:3000'],
  ])('AC-10: production refuses APP_URL %s, naming APP_URL and no key value', (_n, appUrl) => {
    let error: Error | null = null;
    try {
      resolveTurnstileConfig({ isProduction: true, secretKey: SECRET, siteKey: SITE, appUrl });
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toMatch(/APP_URL/);
    expect(error!.message).not.toContain(SECRET);
    expect(error!.message).not.toContain(SITE);
  });

  it('AC-11: outside production an unset secret falls back to the always-pass test secret', () => {
    const resolved = resolveTurnstileConfig({ isProduction: false, secretKey: '', siteKey: '', appUrl: undefined });
    expect(resolved.secretKey).toBe(TURNSTILE_TEST_SECRET_KEY);
    expect(resolved.usingTestKey).toBe(true);
  });

  it('AC-11: outside production a configured secret is used as is', () => {
    const resolved = resolveTurnstileConfig({ isProduction: false, secretKey: SECRET, siteKey: '', appUrl: 'http://localhost:3000' });
    expect(resolved).toMatchObject({ secretKey: SECRET, usingTestKey: false, expectedHostname: 'localhost' });
  });
});

describe('TurnstileService.onModuleInit', () => {
  it('AC-10: refuses to boot in production with a missing secret (Error names the variable)', () => {
    const service = new TurnstileService(configFor({ ...PROD, secretKey: '' }), { log: () => consoleLogger() } as any);
    expect(() => service.onModuleInit()).toThrow(/TURNSTILE_SECRET_KEY/);
  });

  it('AC-10: refuses to boot in production with a test secret, without the value in the message', () => {
    const service = new TurnstileService(configFor({ ...PROD, secretKey: TURNSTILE_TEST_SECRET_KEY }), { log: () => consoleLogger() } as any);
    expect(() => service.onModuleInit()).toThrow(Error);
    try {
      service.onModuleInit();
    } catch (e) {
      expect((e as Error).message).not.toContain(TURNSTILE_TEST_SECRET_KEY);
    }
  });

  it('AC-3: production with real keys writes no api.bootstrap line', () => {
    build(PROD);
    expect(lines.filter((l) => l.channel === 'api.bootstrap')).toHaveLength(0);
  });

  it('AC-7: outside production with TURNSTILE_* unset boots and writes one WARN api.bootstrap line naming the test key', () => {
    build(LOCAL_UNSET);
    const boot = lines.filter((l) => l.channel === 'api.bootstrap');
    expect(boot).toHaveLength(1);
    expect(boot[0].level).toBe('WARN');
    expect(boot[0].message).toBe('Turnstile secret not set, using the always-pass test key');
    expect(JSON.stringify(lines)).not.toContain(TURNSTILE_TEST_SECRET_KEY);
  });

  it.each([
    ['real keys', LOCAL_REAL],
    ['Cloudflare test secret and localhost APP_URL', { isProduction: false, secretKey: TURNSTILE_TEST_SECRET_KEY, siteKey: SITE, appUrl: 'http://localhost:3000' }],
    ['a configured secret and an invalid APP_URL', { isProduction: false, secretKey: SECRET, siteKey: '   ', appUrl: 'not-a-url' }],
  ] as Array<[string, Env]>)('AC-7: outside production with %s boots without throwing and writes no api.bootstrap line', (_n, env) => {
    expect(() => build(env)).not.toThrow();
    expect(lines.filter((l) => l.channel === 'api.bootstrap')).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('TurnstileService.verify', () => {
  describe('AC-11: outside production verify still calls Siteverify', () => {
    it('AC-11: with TURNSTILE_* unset a valid token resolves after one Siteverify call that sends the test secret', async () => {
      fetchMock.mockResolvedValueOnce(ok({ hostname: 'localhost' }));
      await expect(build(LOCAL_UNSET).verify(TOKEN, SIGNUP)).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sentBody().get('secret')).toBe(TURNSTILE_TEST_SECRET_KEY);
      expect(sentBody().get('response')).toBe(TOKEN);
    });

    it('AC-11: with real keys the configured secret is sent and the APP_URL hostname is checked', async () => {
      fetchMock.mockResolvedValueOnce(ok());
      await expect(build(LOCAL_REAL).verify(TOKEN, SIGNUP)).resolves.toBeUndefined();
      expect(sentBody().get('secret')).toBe(SECRET);
    });

    it('AC-11: outside production a rejected token is still 403 with one warn line', async () => {
      fetchMock.mockResolvedValueOnce(rejected(['invalid-input-response']));
      await expect403(build(LOCAL_REAL).verify(TOKEN, SIGNUP));
      const tl = turnstileLines();
      expect(tl).toHaveLength(1);
      expect(tl[0]).toMatchObject({ level: 'WARN', message: 'Turnstile verification rejected' });
      expectNoSecretsLogged();
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['empty', ''],
      ['a number', 12345],
      ['2049 chars', 'a'.repeat(2049)],
    ])('AC-11: a %s token is 403 without calling Siteverify', async (_n, token) => {
      await expect403(build(LOCAL_UNSET).verify(token, SIGNUP));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(turnstileLines()).toHaveLength(0);
    });

    it('AC-11: outside production a testing-key result is accepted with no critical and no turnstile line', async () => {
      fetchMock.mockResolvedValueOnce(
        json({ success: true, 'error-codes': [], hostname: 'localhost', action: SIGNUP, metadata: { result_with_testing_key: true } }),
      );
      await expect(build(LOCAL_UNSET).verify(TOKEN, SIGNUP)).resolves.toBeUndefined();
      expect(lines.filter((l) => l.level === 'CRITICAL')).toHaveLength(0);
      expect(turnstileLines()).toHaveLength(0);
    });
  });

  describe('AC-12: verify before onModuleInit fails closed', () => {
    it.each([
      ['production', PROD],
      ['non-production', LOCAL_UNSET],
    ] as Array<[string, Env]>)('AC-12: %s config, verify without onModuleInit rejects with a plain Error and never calls Siteverify', async (_n, env) => {
      const service = new TurnstileService(configFor(env), { log: () => consoleLogger(), ip_address: IP } as any);
      const error = await service.verify(TOKEN, SIGNUP).then(
        () => {
          throw new Error('expected a rejection');
        },
        (e: unknown) => e,
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(ApiException);
      expect((error as Error).message).toMatch(/used before onModuleInit/);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('AC-12: a missing token before onModuleInit still throws the plain Error, not a 403', async () => {
      const service = new TurnstileService(configFor(LOCAL_UNSET), { log: () => consoleLogger() } as any);
      await expect(service.verify(undefined, SIGNUP)).rejects.not.toBeInstanceOf(ApiException);
    });
  });

  describe('AC-1: token shape', () => {
    it.each([
      ['missing', undefined],
      ['null', null],
      ['a number', 12345],
      ['an object', { token: TOKEN }],
      ['an array', [TOKEN]],
      ['empty', ''],
      ['whitespace only', '    '],
      ['2049 chars', 'a'.repeat(2049)],
    ])('AC-1: a %s token is 403 TURNSTILE_FAILED without calling Siteverify or logging', async (_n, token) => {
      const service = build(PROD);
      await expect403(service.verify(token, SIGNUP));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(turnstileLines()).toHaveLength(0);
    });

    it('AC-1: a 2048-char token is accepted for verification (boundary)', async () => {
      fetchMock.mockResolvedValueOnce(ok());
      await expect(build(PROD).verify('a'.repeat(2048), SIGNUP)).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC-2 / AC-8: Siteverify rejects the token', () => {
    it.each(['invalid-input-response', 'timeout-or-duplicate', 'missing-input-response'])(
      'AC-2: %s is 403 with one warn line (AC-8)',
      async (code) => {
        fetchMock.mockResolvedValueOnce(rejected([code]));
        await expect403(build(PROD).verify(TOKEN, SIGNUP));
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const tl = turnstileLines();
        expect(tl).toHaveLength(1);
        expect(tl[0]).toMatchObject({ level: 'WARN', channel: 'auth', operation: 'turnstile-verify', message: 'Turnstile verification rejected' });
        expect(tl[0].extraInfo).toEqual({ reason: 'siteverify-failed', error_codes: [code], turnstile_action: SIGNUP });
        expectNoSecretsLogged();
      },
    );
  });

  describe('AC-3: success', () => {
    it('AC-3 / AC-9: a matching action and hostname resolves and writes no turnstile line', async () => {
      fetchMock.mockResolvedValueOnce(ok());
      await expect(build(PROD).verify(TOKEN, SIGNUP)).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(turnstileLines()).toHaveLength(0);
    });
  });

  describe('AC-4 / AC-8: hostname and action checks', () => {
    it('AC-4: a different hostname is 403 with warn {hostname-mismatch, received_hostname}', async () => {
      fetchMock.mockResolvedValueOnce(ok({ hostname: 'evil.example' }));
      await expect403(build(PROD).verify(TOKEN, SIGNUP));
      const tl = turnstileLines();
      expect(tl).toHaveLength(1);
      expect(tl[0].level).toBe('WARN');
      expect(tl[0].extraInfo).toEqual({ reason: 'hostname-mismatch', received_hostname: 'evil.example', turnstile_action: SIGNUP });
      expectNoSecretsLogged();
    });

    it.each(['www.a11studio.com', 'localhost', '127.0.0.1'])('AC-4: hostname %s is rejected in production', async (hostname) => {
      fetchMock.mockResolvedValueOnce(ok({ hostname }));
      await expect403(build(PROD).verify(TOKEN, SIGNUP));
    });

    it('AC-4: a missing hostname is rejected', async () => {
      fetchMock.mockResolvedValueOnce(ok({ hostname: undefined }));
      await expect403(build(PROD).verify(TOKEN, SIGNUP));
    });

    it('AC-8: a long received hostname is truncated to 253 chars', async () => {
      fetchMock.mockResolvedValueOnce(ok({ hostname: 'h'.repeat(400) }));
      await expect403(build(PROD).verify(TOKEN, SIGNUP));
      expect(turnstileLines()[0].extraInfo.received_hostname.length).toBeLessThanOrEqual(253);
    });

    it('AC-4: a different action is 403 with warn {action-mismatch, received_action}', async () => {
      fetchMock.mockResolvedValueOnce(ok({ action: 'login' }));
      await expect403(build(PROD).verify(TOKEN, SIGNUP));
      const tl = turnstileLines();
      expect(tl).toHaveLength(1);
      expect(tl[0].level).toBe('WARN');
      expect(tl[0].extraInfo).toEqual({ reason: 'action-mismatch', received_action: 'login', turnstile_action: SIGNUP });
      expectNoSecretsLogged();
    });

    it('AC-4: a missing action is rejected (outside the testing-key path)', async () => {
      fetchMock.mockResolvedValueOnce(ok({ action: undefined }));
      await expect403(build(PROD).verify(TOKEN, SIGNUP));
    });

    it('AC-8: a long received action is truncated to 32 chars', async () => {
      fetchMock.mockResolvedValueOnce(ok({ action: 'a'.repeat(200) }));
      await expect403(build(PROD).verify(TOKEN, SIGNUP));
      expect(turnstileLines()[0].extraInfo.received_action.length).toBeLessThanOrEqual(32);
    });
  });

  describe('AC-5 / AC-9: transport failures are retried once with the same idempotency_key', () => {
    const transient: Array<[string, () => void]> = [
      ['a timeout', () => fetchMock.mockRejectedValueOnce(timeoutError())],
      ['a network error', () => fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))],
      ['HTTP 500', () => fetchMock.mockResolvedValueOnce(new Response('oops', { status: 500 }))],
      ['HTTP 502', () => fetchMock.mockResolvedValueOnce(new Response('<html>bad gateway</html>', { status: 502 }))],
      ['a non-JSON 200', () => fetchMock.mockResolvedValueOnce(new Response('<html>not json</html>', { status: 200 }))],
      ['internal-error', () => fetchMock.mockResolvedValueOnce(rejected(['internal-error']))],
    ];

    it.each(transient)('AC-5: %s then success resolves after exactly 2 calls with the same idempotency_key', async (_n, fail) => {
      fail();
      fetchMock.mockResolvedValueOnce(ok());
      await expect(build(PROD).verify(TOKEN, SIGNUP)).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const first = sentBody(0).get('idempotency_key');
      expect(first).toMatch(UUID_RE);
      expect(sentBody(1).get('idempotency_key')).toBe(first);
      expect(sentBody(1).get('response')).toBe(TOKEN);
      expect(turnstileLines()).toHaveLength(0);
    });

    it.each(transient)('AC-5 / AC-9: %s twice is 503 TURNSTILE_UNAVAILABLE with one error line {attempts: 2}', async (_n, fail) => {
      fail();
      fail();
      await expect503(build(PROD).verify(TOKEN, SIGNUP));
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const tl = turnstileLines();
      expect(tl).toHaveLength(1);
      expect(tl[0]).toMatchObject({ level: 'ERROR', channel: 'auth', operation: 'turnstile-verify', message: 'Turnstile siteverify unavailable' });
      expect(tl[0].extraInfo).toMatchObject({ step: 'siteverify', attempts: 2, turnstile_action: SIGNUP });
      expect(typeof tl[0].extraInfo.error_name).toBe('string');
      expect(tl[0].extraInfo.error_name.length).toBeGreaterThan(0);
      expectNoSecretsLogged();
    });

    it('AC-9: two timeouts log error_name TimeoutError and no http_status', async () => {
      fetchMock.mockRejectedValueOnce(timeoutError()).mockRejectedValueOnce(timeoutError());
      await expect503(build(PROD).verify(TOKEN, SIGNUP));
      const [line] = turnstileLines();
      expect(line.extraInfo.error_name).toBe('TimeoutError');
      expect(line.extraInfo.http_status).toBeUndefined();
    });

    it('AC-9: two HTTP 503s log http_status 503', async () => {
      fetchMock
        .mockResolvedValueOnce(new Response('x', { status: 503 }))
        .mockResolvedValueOnce(new Response('x', { status: 503 }));
      await expect503(build(PROD).verify(TOKEN, SIGNUP));
      expect(turnstileLines()[0].extraInfo.http_status).toBe(503);
    });

    it('AC-5: every attempt carries a 4 s abort signal', async () => {
      const timeoutSpy = jest.spyOn(AbortSignal, 'timeout');
      fetchMock.mockRejectedValueOnce(timeoutError()).mockResolvedValueOnce(ok());
      await build(PROD).verify(TOKEN, SIGNUP);
      expect(timeoutSpy).toHaveBeenCalledTimes(2);
      for (const call of timeoutSpy.mock.calls) expect(call[0]).toBe(4000);
      for (const call of fetchMock.mock.calls) expect(call[1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('AC-6 / AC-9: Siteverify config faults', () => {
    it.each([
      ['missing-input-secret', 200],
      ['invalid-input-secret', 200],
      ['bad-request', 200],
      ['bad-request', 400],
    ])('AC-6: %s (HTTP %s) is 503 with one misconfigured error line and no retry', async (code, status) => {
      fetchMock.mockResolvedValueOnce(rejected([code], status));
      await expect503(build(PROD).verify(TOKEN, SIGNUP));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const tl = turnstileLines();
      expect(tl).toHaveLength(1);
      expect(tl[0]).toMatchObject({ level: 'ERROR', message: 'Turnstile siteverify misconfigured' });
      expect(tl[0].extraInfo).toEqual({ reason: 'siteverify-misconfigured', error_codes: [code], turnstile_action: SIGNUP });
      expectNoSecretsLogged();
    });
  });

  describe('AC-7: the Siteverify request', () => {
    it('AC-7: POSTs a form-encoded body with secret, response and a UUID idempotency_key to the Siteverify URL', async () => {
      fetchMock.mockResolvedValueOnce(ok());
      await build(PROD).verify(TOKEN, SIGNUP);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
      expect(url).toBe(TURNSTILE_SITEVERIFY_URL);
      expect(init.method).toBe('POST');
      const headers = new Headers(init.headers);
      expect(headers.get('content-type')).toBe('application/x-www-form-urlencoded');
      expect(typeof init.body).toBe('string');
      const body = sentBody();
      expect(body.get('secret')).toBe(SECRET);
      expect(body.get('response')).toBe(TOKEN);
      expect(body.get('idempotency_key')).toMatch(UUID_RE);
      expect(body.get('remoteip')).toBe(IP);
      expect([...new Set(body.keys())].sort()).toEqual(['idempotency_key', 'remoteip', 'response', 'secret']);
    });

    it('AC-7: each verification gets its own idempotency_key', async () => {
      fetchMock.mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok());
      const service = build(PROD);
      await service.verify(TOKEN, SIGNUP);
      await service.verify(TOKEN, SIGNUP);
      expect(sentBody(0).get('idempotency_key')).not.toBe(sentBody(1).get('idempotency_key'));
    });

    it.each([
      ['the first of a forwarded list', '203.0.113.9, 10.0.0.1', '203.0.113.9'],
      ['an IPv6 address', '2001:db8::1', '2001:db8::1'],
      ['a padded single IP', '  198.51.100.4  ', '198.51.100.4'],
    ])('AC-7: remoteip is %s', async (_n, ip, expected) => {
      fetchMock.mockResolvedValueOnce(ok());
      await build(PROD, ip).verify(TOKEN, SIGNUP);
      expect(sentBody().get('remoteip')).toBe(expected);
    });

    it.each([
      ['"-"', '-'],
      ['null', null],
      ['empty', ''],
      ['not an IP', 'not-an-ip'],
      ['a list whose first entry is invalid', 'unknown, 203.0.113.9'],
    ])('AC-7: remoteip is left out when ip_address is %s', async (_n, ip) => {
      fetchMock.mockResolvedValueOnce(ok());
      await build(PROD, ip).verify(TOKEN, SIGNUP);
      expect(sentBody().has('remoteip')).toBe(false);
      expect([...new Set(sentBody().keys())].sort()).toEqual(['idempotency_key', 'response', 'secret']);
    });
  });

  describe('AC-11 / AC-12: testing-key results', () => {
    const testingKeyResult = () =>
      json({ success: true, 'error-codes': [], hostname: 'example.com', metadata: { result_with_testing_key: true } });

    it('AC-12: in production a testing-key result is 503 with exactly one critical line', async () => {
      fetchMock.mockResolvedValueOnce(testingKeyResult());
      await expect503(build(PROD).verify(TOKEN, SIGNUP));
      const critical = lines.filter((l) => l.level === 'CRITICAL');
      expect(critical).toHaveLength(1);
      expect(critical[0]).toMatchObject({
        channel: 'auth',
        operation: 'turnstile-verify',
        message: 'Turnstile testing-key result in production',
      });
      expect(critical[0].extraInfo).toEqual({ turnstile_action: SIGNUP });
      expect(turnstileLines()).toHaveLength(1);
      expectNoSecretsLogged();
    });
  });
});
