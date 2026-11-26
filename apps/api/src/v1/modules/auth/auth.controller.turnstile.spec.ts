jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
  stripeWebhookSecret: '',
}));

import { INestApplication } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { logService } from '@repo/backend-lib/config/logging';
import request from 'supertest';
import { TURNSTILE_ACTION_KEY } from 'src/common/decorators/require-turnstile.decorator';
import { TurnstileGuard } from 'src/common/guards/turnstile.guard';
import { RequestService } from 'src/common/services/request.service';
import { TurnstileService } from 'src/common/services/turnstile.service';
import { consoleLogger } from 'src/common/testing/console-logger';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const APP_HOST = 'a11studio.com';
const TOKEN = 'XXXX.SECRETWIDGETTOKEN.XXXX';
const BODY = { email: 'new@example.com', password: 'abc12345' };
const LOGIN_RETURN = { token: 'jwt', user: { id: 1 } };

const authService = {
  register: jest.fn(),
  login: jest.fn(),
  verify2fa: jest.fn(),
  resend2fa: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  passwordRecovery: jest.fn(),
  checkPasswordRecoveryAttempt: jest.fn(),
  updatePassword: jest.fn(),
  oauth2Initiate: jest.fn(),
  handleOauth2Callback: jest.fn(),
};

const config: Record<string, unknown> = {
  'app.isProduction': true,
  'app.url': `https://${APP_HOST}`,
  'turnstile.secretKey': 'real-secret-SECRETVALUE-0001',
  'turnstile.siteKey': 'real-site-SITEVALUE-0001',
};

const siteverify = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('AuthController + TurnstileGuard', () => {
  let app: INestApplication;
  let fetchMock: jest.Mock;
  /** The real global `fetch`, put back after every test so no other suite sees the mock. */
  const originalFetch = global.fetch;

  beforeAll(async () => {
    jest.spyOn(logService, 'api').mockImplementation((cfg = {}) => consoleLogger(cfg));
    for (const method of ['log', 'warn', 'error'] as const) jest.spyOn(console, method).mockImplementation(() => undefined);
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        TurnstileService,
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: { get: (key: string) => config[key] } },
        {
          provide: RequestService,
          useValue: { ip_address: '203.0.113.7', log: () => consoleLogger({ defaultOptions: { channel: 'auth', operation: 'turnstile-verify' } }) },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    for (const fn of Object.values(authService)) fn.mockReset().mockResolvedValue(LOGIN_RETURN);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('POST /auth/register', () => {
    it.each([
      ['no turnstile_token', BODY],
      ['an empty turnstile_token', { ...BODY, turnstile_token: '' }],
      ['a non-string turnstile_token', { ...BODY, turnstile_token: 12345 }],
      ['a 2049-char turnstile_token', { ...BODY, turnstile_token: 'a'.repeat(2049) }],
    ])('AC-1: %s is 403 TURNSTILE_FAILED, no Siteverify call, AuthService.register not called', async (_n, body) => {
      const res = await request(app.getHttpServer()).post('/auth/register').send(body);
      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('TURNSTILE_FAILED');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('AC-1: a body without email/password is still 403 before any validation (no email-existence oracle)', async () => {
      const res = await request(app.getHttpServer()).post('/auth/register').send({});
      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('TURNSTILE_FAILED');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('AC-2: a token Siteverify rejects is 403 and AuthService.register is not called', async () => {
      fetchMock.mockResolvedValueOnce(siteverify({ success: false, 'error-codes': ['invalid-input-response'] }));
      const res = await request(app.getHttpServer()).post('/auth/register').send({ ...BODY, turnstile_token: TOKEN });
      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('TURNSTILE_FAILED');
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('AC-4: a valid token for another hostname is 403', async () => {
      fetchMock.mockResolvedValueOnce(siteverify({ success: true, hostname: 'evil.example', action: 'signup' }));
      const res = await request(app.getHttpServer()).post('/auth/register').send({ ...BODY, turnstile_token: TOKEN });
      expect(res.status).toBe(403);
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('AC-5: Siteverify down on both attempts is 503 TURNSTILE_UNAVAILABLE and register is not called', async () => {
      fetchMock.mockRejectedValue(Object.assign(new Error('timeout'), { name: 'TimeoutError' }));
      const res = await request(app.getHttpServer()).post('/auth/register').send({ ...BODY, turnstile_token: TOKEN });
      expect(res.status).toBe(503);
      expect(res.body.errorCode).toBe('TURNSTILE_UNAVAILABLE');
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('AC-3: a valid signup token for APP_URL\'s host reaches AuthService.register and returns its result unchanged', async () => {
      fetchMock.mockResolvedValueOnce(siteverify({ success: true, 'error-codes': [], hostname: APP_HOST, action: 'signup' }));
      const res = await request(app.getHttpServer()).post('/auth/register').send({ ...BODY, turnstile_token: TOKEN });
      expect(res.status).toBe(201);
      expect(res.body).toEqual(LOGIN_RETURN);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register.mock.calls[0][0]).toMatchObject(BODY);
    });
  });

  describe('AC-13: register is the only guarded route', () => {
    const routes = Object.getOwnPropertyNames(AuthController.prototype).filter(
      (name) => name !== 'constructor' && typeof (AuthController.prototype as any)[name] === 'function',
    );
    const guardsOf = (name: string): unknown[] => Reflect.getMetadata(GUARDS_METADATA, (AuthController.prototype as any)[name]) ?? [];

    it('AC-13: register carries TurnstileGuard with action "signup"', () => {
      expect(guardsOf('register')).toContain(TurnstileGuard);
      expect(Reflect.getMetadata(TURNSTILE_ACTION_KEY, AuthController.prototype.register)).toBe('signup');
    });

    it('AC-13: no other AuthController route (incl. oauth2 initiate/callback) carries TurnstileGuard or an action', () => {
      const others = routes.filter((name) => name !== 'register');
      expect(others).toEqual(
        expect.arrayContaining(['login', 'verify2fa', 'resend2fa', 'passwordRecovery', 'Oauth2Initiate', 'Oauth2Callback']),
      );
      for (const name of others) {
        expect({ name, guarded: guardsOf(name).includes(TurnstileGuard) }).toEqual({ name, guarded: false });
        expect({ name, action: Reflect.getMetadata(TURNSTILE_ACTION_KEY, (AuthController.prototype as any)[name]) }).toEqual({
          name,
          action: undefined,
        });
      }
    });

    it('AC-13: the controller class itself carries no TurnstileGuard', () => {
      const classGuards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, AuthController) ?? [];
      expect(classGuards).not.toContain(TurnstileGuard);
      expect(Reflect.getMetadata(TURNSTILE_ACTION_KEY, AuthController)).toBeUndefined();
    });

    it.each([
      ['POST', '/auth/login', 'login'],
      ['POST', '/auth/verify-2fa', 'verify2fa'],
      ['POST', '/auth/password-recovery', 'passwordRecovery'],
      ['POST', '/auth/oauth2/callback', 'handleOauth2Callback'],
      ['GET', '/auth/oauth2/initiate', 'oauth2Initiate'],
    ] as const)('AC-13: %s %s works without a token and never calls Siteverify', async (method, path, serviceMethod) => {
      const server = request(app.getHttpServer());
      const res = method === 'GET' ? await server.get(path) : await server.post(path).send({ email: 'a@b.c', password: 'abc12345', code: 'x' });
      expect(res.status).toBeLessThan(300);
      expect((authService as any)[serviceMethod]).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

