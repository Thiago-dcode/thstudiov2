import { EventEmitter } from 'events';
import { AsyncLocalStorage } from 'async_hooks';
import { ConfigService } from '@nestjs/config';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import type { RequestStore } from '@repo/common-lib/types/request';
import type { UserAuth } from '@repo/common-lib/types/auth';
import { RequestService } from 'src/common/services/request.service';
import {
  ACCESS_LOG_CHANNEL,
  ACCESS_LOG_SKIP_PATHS,
  RequestMiddleware,
} from './request.middleware';

type Fake = { info: jest.Mock; warn: jest.Mock; error: jest.Mock };

const setup = () => {
  const fake: Fake = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const create = jest.spyOn(FactoryLogService, 'createLogService').mockReturnValue(fake as unknown as LogService);
  const flush = jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  const requestService = new RequestService(new AsyncLocalStorage<RequestStore>());
  const config = { get: jest.fn().mockReturnValue('app-token') } as unknown as ConfigService;
  const middleware = new RequestMiddleware(requestService, config);
  return { fake, create, flush, requestService, middleware };
};

const makeReq = (over: Record<string, unknown> = {}) => {
  const headers: Record<string, string> = { 'user-agent': 'jest-agent', ...((over.headers as object) ?? {}) };
  return {
    method: 'GET',
    originalUrl: '/v1/media/5?x=1',
    url: '/media/5?x=1',
    headers,
    query: {},
    ip: '9.9.9.9',
    get: (name: string) => headers[name.toLowerCase()],
    ...over,
    headers_: undefined,
  } as any;
};

const makeRes = (over: Record<string, unknown> = {}) => {
  const res: any = new EventEmitter();
  res.statusCode = 200;
  res.writableFinished = true;
  res.setHeader = jest.fn();
  Object.assign(res, over);
  return res;
};

const run = async (middleware: RequestMiddleware, req: any, res: any) => {
  const next = jest.fn();
  await middleware.use(req, res, next);
  return next;
};

describe('RequestMiddleware', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-14: builds one dedicated api.access FileLogService in the constructor with the binding', () => {
    const { create, requestService } = setup();
    expect(create).toHaveBeenCalledTimes(1);
    const [type, cfg] = create.mock.calls[0];
    expect(type).toBe('file');
    expect(cfg.channel).toBe(ACCESS_LOG_CHANNEL);
    expect(ACCESS_LOG_CHANNEL).toBe('api.access');
    expect(typeof cfg.id).toBe('function');
    expect(typeof cfg.request).toBe('function');
    expect(requestService.requestId).toBeNull();
  });

  it('AC-4: stores method and the path without the query string', async () => {
    const { middleware, requestService } = setup();
    let seen: { method: string | null; path: string | null } | null = null;
    // The path is only resolved once a route is matched (null before), so give it one.
    const req = makeReq({ method: 'POST', originalUrl: '/v1/auth/verify?token=abc', route: { path: '/v1/auth/verify' } });
    const next = jest.fn(() => {
      seen = { method: requestService.method, path: requestService.path };
    });
    await middleware.use(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(seen).toEqual({ method: 'POST', path: '/v1/auth/verify' });
  });

  it('AC-4/AC-19: no query string or token ever reaches request.path in the log context', async () => {
    const { middleware, requestService } = setup();
    let log: any;
    const req = makeReq({ originalUrl: '/v1/auth/verify?token=abc', route: { path: '/v1/auth/verify' } });
    await middleware.use(req, makeRes(), () => {
      log = requestService.log;
    });
    expect(JSON.stringify(log)).not.toContain('abc');
    expect(log.path).toBe('/v1/auth/verify');
  });

  it('AC-14: registers exactly one close listener and writes one line even if close fires twice', async () => {
    const { middleware, fake } = setup();
    const res = makeRes();
    const req = makeReq({ route: { path: '/v1/media/:id' } });
    await run(middleware, req, res);
    expect(res.listenerCount('close')).toBe(1);
    res.emit('close');
    res.emit('close');
    const total = fake.info.mock.calls.length + fake.warn.mock.calls.length + fake.error.mock.calls.length;
    expect(total).toBe(1);
  });

  it('AC-15: info line has template message and extraInfo shape', async () => {
    const { middleware, fake } = setup();
    const res = makeRes({ statusCode: 200 });
    await run(middleware, makeReq({ route: { path: '/v1/media/:id' } }), res);
    res.emit('close');
    expect(fake.info).toHaveBeenCalledTimes(1);
    const [message, extra] = fake.info.mock.calls[0];
    expect(message).toBe('GET /v1/media/:id 200');
    expect(Object.keys(extra)).toEqual(['route', 'status_code', 'duration_ms', 'aborted']);
    expect(extra.route).toBe('/v1/media/:id');
    expect(extra.status_code).toBe(200);
    expect(Number.isInteger(extra.duration_ms)).toBe(true);
    expect(extra.duration_ms).toBeGreaterThanOrEqual(0);
    expect(extra.aborted).toBe(false);
  });

  it('AC-15: route is read at close time (set after the middleware ran)', async () => {
    const { middleware, fake } = setup();
    const res = makeRes();
    const req = makeReq();
    await run(middleware, req, res);
    req.route = { path: '/v1/late/:id' };
    res.emit('close');
    expect(fake.info.mock.calls[0][0]).toBe('GET /v1/late/:id 200');
  });

  it('AC-15: unmatched route gives message "unmatched" and route null, level warn for 404', async () => {
    const { middleware, fake } = setup();
    const res = makeRes({ statusCode: 404 });
    await run(middleware, makeReq({ originalUrl: '/v1/does-not-exist' }), res);
    res.emit('close');
    expect(fake.warn).toHaveBeenCalledTimes(1);
    const [message, extra] = fake.warn.mock.calls[0];
    expect(message).toBe('GET unmatched 404');
    expect(extra.route).toBeNull();
    expect(message).not.toContain('does-not-exist');
  });

  it.each([
    [200, 'info'],
    [301, 'info'],
    [399, 'info'],
    [400, 'warn'],
    [401, 'warn'],
    [403, 'warn'],
    [429, 'warn'],
    [499, 'warn'],
    [500, 'error'],
    [503, 'error'],
  ])('AC-15: status %i logs at %s only', async (status, level) => {
    const { middleware, fake } = setup();
    const res = makeRes({ statusCode: status });
    await run(middleware, makeReq({ route: { path: '/v1/x' } }), res);
    res.emit('close');
    for (const l of ['info', 'warn', 'error'] as const) {
      expect(fake[l]).toHaveBeenCalledTimes(l === level ? 1 : 0);
    }
  });

  it('AC-15: aborted is true and level warn when the response did not finish', async () => {
    const { middleware, fake } = setup();
    const res = makeRes({ statusCode: 200, writableFinished: false });
    await run(middleware, makeReq({ route: { path: '/v1/x' } }), res);
    res.emit('close');
    expect(fake.warn).toHaveBeenCalledTimes(1);
    expect(fake.warn.mock.calls[0][1].aborted).toBe(true);
    expect(fake.info).not.toHaveBeenCalled();
  });

  it('AC-15: an aborted 5xx stays at error level', async () => {
    const { middleware, fake } = setup();
    const res = makeRes({ statusCode: 500, writableFinished: false });
    await run(middleware, makeReq({ route: { path: '/v1/x' } }), res);
    res.emit('close');
    expect(fake.error).toHaveBeenCalledTimes(1);
  });

  it('AC-15: duration_ms comes from a monotonic clock', async () => {
    const { middleware, fake } = setup();
    const res = makeRes();
    await run(middleware, makeReq({ route: { path: '/v1/x' } }), res);
    const realNow = Date.now;
    // A wall-clock jump must not affect the duration.
    Date.now = () => realNow() + 10 * 60 * 1000;
    try {
      res.emit('close');
    } finally {
      Date.now = realNow;
    }
    expect(fake.info.mock.calls[0][1].duration_ms).toBeLessThan(1000);
  });

  it('AC-16: a guard rejection (401) with no route is still logged, with no error detail', async () => {
    const { middleware, fake } = setup();
    const res = makeRes({ statusCode: 401 });
    const req = makeReq({ body: { password: 'pw' }, params: { id: '1' } });
    await run(middleware, req, res);
    res.emit('close');
    const [message, extra] = fake.warn.mock.calls[0];
    expect(Object.keys(extra)).toEqual(['route', 'status_code', 'duration_ms', 'aborted']);
    expect(JSON.stringify([message, extra])).not.toMatch(/pw|x=1/);
  });

  it('AC-17: successful GET / is skipped, with no flush', async () => {
    const { middleware, fake, flush } = setup();
    expect(ACCESS_LOG_SKIP_PATHS.has('/')).toBe(true);
    const res = makeRes({ statusCode: 200 });
    await run(middleware, makeReq({ originalUrl: '/', route: { path: '/' } }), res);
    res.emit('close');
    expect(fake.info).not.toHaveBeenCalled();
    expect(fake.warn).not.toHaveBeenCalled();
    expect(fake.error).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });

  it('AC-17: skip also applies when / carries a query string', async () => {
    const { middleware, fake } = setup();
    const res = makeRes();
    await run(middleware, makeReq({ originalUrl: '/?probe=1', route: { path: '/' } }), res);
    res.emit('close');
    expect(fake.info).not.toHaveBeenCalled();
  });

  it('AC-17: a failing / (500) is still logged', async () => {
    const { middleware, fake } = setup();
    const res = makeRes({ statusCode: 500 });
    await run(middleware, makeReq({ originalUrl: '/', route: { path: '/' } }), res);
    res.emit('close');
    expect(fake.error).toHaveBeenCalledTimes(1);
  });

  it('AC-17: an aborted / is still logged', async () => {
    const { middleware, fake } = setup();
    const res = makeRes({ writableFinished: false });
    await run(middleware, makeReq({ originalUrl: '/', route: { path: '/' } }), res);
    res.emit('close');
    expect(fake.warn).toHaveBeenCalledTimes(1);
  });

  it('AC-17: other paths are not skipped (OPTIONS preflight, /v1/health)', async () => {
    const { middleware, fake } = setup();
    const res = makeRes();
    await run(middleware, makeReq({ method: 'OPTIONS', originalUrl: '/v1/health' }), res);
    res.emit('close');
    expect(fake.info).toHaveBeenCalledTimes(1);
  });

  it('AC-14: the listener runs inside the request store (id, method, user set later)', async () => {
    const { middleware, fake, create, requestService } = setup();
    const binding = create.mock.calls[0][1];
    const resA = makeRes();
    const resB = makeRes();
    let idA: string | null = null;
    let idB: string | null = null;
    await middleware.use(makeReq({ method: 'GET', route: { path: '/a' } }), resA, () => {
      idA = requestService.requestId;
      requestService.user = { id: 5, role: { id: 1, name: 'ADMIN' } } as unknown as UserAuth;
    });
    await middleware.use(makeReq({ method: 'POST', route: { path: '/b' } }), resB, () => {
      idB = requestService.requestId;
    });
    expect(idA).not.toBe(idB);

    const seen: any[] = [];
    fake.info.mockImplementation(() => {
      seen.push({ id: (binding.id as () => string | null)(), request: (binding.request as () => any)() });
    });
    // Close from outside any store, in the opposite order.
    resB.emit('close');
    resA.emit('close');
    expect(requestService.requestId).toBeNull();

    expect(seen[0].id).toBe(idB);
    expect(seen[0].request.id).toBe(idB);
    expect(seen[0].request.method).toBe('POST');
    expect(seen[0].request.user_id).toBeNull();
    expect(seen[1].id).toBe(idA);
    expect(seen[1].request.method).toBe('GET');
    expect(seen[1].request.user_id).toBe(5);
    expect(seen[1].request.user_role).toBe('ADMIN');
  });

  it('AC-18: flushes in process after writing the line', async () => {
    const { middleware, fake, flush } = setup();
    const order: string[] = [];
    fake.info.mockImplementation(() => order.push('write'));
    flush.mockImplementation(async () => {
      order.push('flush');
    });
    const res = makeRes();
    await run(middleware, makeReq({ route: { path: '/v1/x' } }), res);
    res.emit('close');
    expect(order).toEqual(['write', 'flush']);
  });

  it('AC-18: a rejected flush is caught and never throws', async () => {
    const { middleware, flush } = setup();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    flush.mockRejectedValue(new Error('disk full'));
    const res = makeRes();
    await run(middleware, makeReq({ route: { path: '/v1/x' } }), res);
    expect(() => res.emit('close')).not.toThrow();
    await new Promise((r) => setImmediate(r));
    expect(errSpy).toHaveBeenCalledWith('Failed to flush access logs:', expect.any(Error));
  });

  it('AC-18: a throwing logger is caught and never throws', async () => {
    const { middleware, fake } = setup();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    fake.info.mockImplementation(() => {
      throw new Error('boom');
    });
    const res = makeRes();
    await run(middleware, makeReq({ route: { path: '/v1/x' } }), res);
    expect(() => res.emit('close')).not.toThrow();
    expect(errSpy).toHaveBeenCalled();
  });

  it('AC-19: the access line carries no query, authorization or token in message/extraInfo', async () => {
    const { middleware, fake } = setup();
    const res = makeRes();
    const req = makeReq({
      originalUrl: '/v1/auth/verify?token=SECRETQ',
      route: { path: '/v1/auth/verify' },
      headers: { authorization: 'Bearer SECRETB', cookie: 'sid=SECRETC' },
    });
    await run(middleware, req, res);
    res.emit('close');
    const dumped = JSON.stringify(fake.info.mock.calls[0]);
    expect(dumped).not.toMatch(/SECRET/);
  });
});

describe('RequestMiddleware secret path params', () => {
  afterEach(() => jest.restoreAllMocks());

  const SECRET_ROUTES: Array<[string, string, Record<string, string>, string]> = [
    ['/api/v1/email-preferences/SECRETP/token', '/api/v1/email-preferences/:token/token', { token: 'SECRETP' }, '/api/v1/email-preferences/:token/token'],
    ['/api/v1/invitation-links/SECRETP/code', '/api/v1/invitation-links/:code/code', { code: 'SECRETP' }, '/api/v1/invitation-links/:code/code'],
    ['/api/v1/wait-list/invitation/SECRETP', '/api/v1/wait-list/invitation/:code', { code: 'SECRETP' }, '/api/v1/wait-list/invitation/:code'],
  ];

  it.each(SECRET_ROUTES)('AC-19: %s never exposes the secret in requestService.log or the access line', async (url, template, params, masked) => {
    const { middleware, fake, create, requestService } = setup();
    const binding = create.mock.calls[0][1];
    const res = makeRes({ statusCode: 200 });
    const req = makeReq({ originalUrl: url, route: { path: template }, params });
    let logDuringRequest: any;
    await middleware.use(req, res, () => {
      logDuringRequest = requestService.log;
    });
    expect(JSON.stringify(logDuringRequest)).not.toContain('SECRETP');
    expect(logDuringRequest.path).toBe(masked);

    let resolved: any;
    fake.info.mockImplementation(() => {
      resolved = (binding.request as () => any)();
    });
    res.emit('close');
    expect(fake.info).toHaveBeenCalledTimes(1);
    expect(resolved.path).toBe(masked);
    expect(JSON.stringify([resolved, fake.info.mock.calls[0]])).not.toContain('SECRETP');
    expect(fake.info.mock.calls[0][1].route).toBe(template);
  });

  it('AC-19: a percent-encoded secret segment is masked too', async () => {
    const { middleware, requestService } = setup();
    const req = makeReq({
      originalUrl: '/api/v1/wait-list/invitation/a%2Bb',
      route: { path: '/api/v1/wait-list/invitation/:code' },
      params: { code: 'a+b' },
    });
    let log: any;
    await middleware.use(req, makeRes(), () => {
      log = requestService.log;
    });
    expect(JSON.stringify(log)).not.toMatch(/a%2Bb|a\+b/);
  });

  it('AC-19: pre-routing lines have request.path null, then the masked path once routed', async () => {
    const { middleware, requestService } = setup();
    const req = makeReq({ originalUrl: '/api/v1/email-preferences/SECRETP/token' });
    const seen: any[] = [];
    await middleware.use(req, makeRes(), () => {
      seen.push(requestService.log);
      req.route = { path: '/api/v1/email-preferences/:token/token' };
      req.params = { token: 'SECRETP' };
      seen.push(requestService.log);
    });
    expect(seen[0].path).toBeNull();
    expect(seen[1].path).toBe('/api/v1/email-preferences/:token/token');
    expect(JSON.stringify(seen)).not.toContain('SECRETP');
  });

  it('AC-19: unmatched 404 access line has request.path null and no raw path', async () => {
    const { middleware, fake, create } = setup();
    const binding = create.mock.calls[0][1];
    const res = makeRes({ statusCode: 404 });
    await run(middleware, makeReq({ originalUrl: '/api/v1/leak/SECRETP?token=SECRETQ' }), res);
    let resolved: any;
    fake.warn.mockImplementation(() => {
      resolved = (binding.request as () => any)();
    });
    res.emit('close');
    expect(resolved.path).toBeNull();
    expect(JSON.stringify([resolved, fake.warn.mock.calls[0]])).not.toMatch(/SECRETP|SECRETQ/);
  });

  it('AC-19: a sensitive param whose value is missing falls back to the route template', async () => {
    const { middleware, requestService } = setup();
    const req = makeReq({
      originalUrl: '/api/v1/email-preferences/SECRETP/token',
      route: { path: '/api/v1/email-preferences/:token/token' },
      params: {},
    });
    let log: any;
    await middleware.use(req, makeRes(), () => {
      log = requestService.log;
    });
    expect(JSON.stringify(log)).not.toContain('SECRETP');
  });

  it('AC-4: ordinary params are kept (/media/5)', async () => {
    const { middleware, fake, create, requestService } = setup();
    const binding = create.mock.calls[0][1];
    const res = makeRes();
    const req = makeReq({ originalUrl: '/api/v1/media/5?x=1', route: { path: '/api/v1/media/:id' }, params: { id: '5' } });
    let log: any;
    await middleware.use(req, res, () => {
      log = requestService.log;
    });
    expect(log.path).toBe('/api/v1/media/5');
    let resolved: any;
    fake.info.mockImplementation(() => {
      resolved = (binding.request as () => any)();
    });
    res.emit('close');
    expect(resolved.path).toBe('/api/v1/media/5');
  });
});
