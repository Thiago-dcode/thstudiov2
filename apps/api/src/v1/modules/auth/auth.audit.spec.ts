jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
  stripeWebhookSecret: '',
}));
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'public-uuid'),
}));
jest.mock('src/common/utils/user-lock', () => ({
  ...jest.requireActual('src/common/utils/user-lock'),
  withUserLock: async (_key: string, _ttlMs: number, fn: () => Promise<unknown>) => fn(),
}));

import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { consoleLogger } from 'src/common/testing/console-logger';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { hash } from '@repo/common-lib/utils/hash';
import { AuthService } from './auth.service';
import { UserService } from '../users/users.service';
import { GoogleOauth2Service } from '@repo/backend-lib/services/googleapi-service';
import { UserOauthProvidersService } from '../user-oauth-providers/user-oauth-providers.service';
import { UserAuthDevicesService } from '../user-auth-devices/user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { TwoFAMail } from './mails/twofa-mail';
import { PasswordRecoveryMail } from './mails/password-recovery-mail';
import { PasswordRecoveryAttemptsService } from './password-recovery-attempts/password-recovery-attempts.service';
import { RoleService } from '../roles/roles.service';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { UserBenefitService } from '../user-benefit/user-benefit.service';
import { WaitListService } from '../wait-list/wait-list.service';

const EMAIL = 'victim@example.com';
const PASSWORD = 'PLAINPASSWORD123';
const TWOFA = '654321';
const RECOVERY_CODE = 'RECOVERYCODESECRET';
const JWT = 'JWTSECRETTOKEN';

const userRepository = { findOneByWithSecrets: jest.fn(), findOneBy: jest.fn(), updateById: jest.fn() };
const devices = { getOneOrCreate: jest.fn(), update: jest.fn(), getOneByAuthDevice: jest.fn() };
const sessions = { handleSessionProcess: jest.fn(), expireAllForUser: jest.fn(), findOneBySession: jest.fn(), update: jest.fn() };
const recoveryAttempts = { findOneByCode: jest.fn(), update: jest.fn() };
const mailSend = jest.fn();
const requestService: Record<string, unknown> = {};

let lines: any[] = [];
let stray: unknown[] = [];

const buildService = async () => {
  lines = [];
  stray = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { stray.push(line); }
    });
  }
  const logger = consoleLogger({ defaultOptions: { channel: 'auth' } });
  requestService.log = () => logger;
  requestService.traceCarrier = () => ({ service: 'api' });
  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: UserService, useValue: userRepository },
      { provide: GoogleOauth2Service, useValue: {} },
      { provide: UserOauthProvidersService, useValue: {} },
      { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue(JWT) } },
      { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      { provide: UserAuthDevicesService, useValue: devices },
      { provide: RequestService, useValue: requestService },
      { provide: UserSessionsService, useValue: sessions },
      { provide: MailService, useValue: { send: mailSend } },
      { provide: TwoFAMail, useValue: { setUser: jest.fn() } },
      { provide: PasswordRecoveryMail, useValue: {} },
      { provide: PasswordRecoveryAttemptsService, useValue: recoveryAttempts },
      { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      { provide: RoleService, useValue: {} },
      { provide: InvitationLinkService, useValue: {} },
      { provide: UserBenefitService, useValue: {} },
      { provide: WaitListService, useValue: {} },
    ],
  }).compile();
  return module.get(AuthService);
};

const audit = (message: string) => lines.filter((l) => l.channel === 'auth' && l.message === message);
const noSecrets = () => {
  const dumped = JSON.stringify(lines);
  for (const secret of [EMAIL, PASSWORD, TWOFA, RECOVERY_CODE, JWT]) expect(dumped).not.toContain(secret);
};

describe('AuthService audit lines', () => {
  let service: AuthService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hash(PASSWORD);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    for (const key of Object.keys(requestService)) delete requestService[key];
    Object.assign(requestService, { user_agent: 'UA', ip_address: '1.2.3.4', language: 'EN' });
    userRepository.updateById.mockImplementation(async (_id: number, data: object) => ({ id: 7, email: EMAIL, email_validated: true, ...data }));
    sessions.handleSessionProcess.mockResolvedValue(undefined);
    sessions.expireAllForUser.mockResolvedValue(undefined);
    mailSend.mockResolvedValue(undefined);
    service = await buildService();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const dbUser = (over: Record<string, unknown> = {}) => ({
    id: 7, email: EMAIL, password: passwordHash, banned: false, twofa_enabled: false, email_validated: true,
    twofa_code: null, twofa_expires_at: null, twofa_attempts: 0, ...over,
  });

  it('AC-26: an unknown email gives warn "Login rejected" {unknown_account} with no user id and no email', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(null);
    await expect(service.login({ email: EMAIL, password: PASSWORD } as any)).rejects.toThrow();
    const [line] = audit('Login rejected');
    expect(line.level).toBe('WARN');
    expect(line.extraInfo).toEqual({ reason: 'unknown_account' });
    expect(line.operation).toBe('login');
    expect('correlation' in line).toBe(false);
    noSecrets();
  });

  it('AC-26: a bad password gives {bad_password} with the user_id', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(dbUser());
    await expect(service.login({ email: EMAIL, password: 'wrong-password' } as any)).rejects.toThrow();
    const [line] = audit('Login rejected');
    expect(line.extraInfo).toEqual({ user_id: 7, reason: 'bad_password' });
    noSecrets();
  });

  it('AC-26: a banned account gives {banned}', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(dbUser({ banned: true, banned_reason: 'abuse' }));
    await expect(service.login({ email: EMAIL, password: PASSWORD } as any)).rejects.toThrow();
    expect(audit('Login rejected')[0].extraInfo).toEqual({ user_id: 7, reason: 'banned' });
  });

  it('AC-26: a trusted-device password login gives info "Login succeeded" {method:password}', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(dbUser());
    devices.getOneOrCreate.mockResolvedValue({ id: 21, disabled: false, blocked_at: null });
    const result: any = await service.login({ email: EMAIL, password: PASSWORD } as any);
    expect(result.token).toBe(JWT);
    const [line] = audit('Login succeeded');
    expect(line.level).toBe('INFO');
    expect(line.method).toBe('password');
    expect(line.extraInfo).toMatchObject({ user_auth_device_id: 21, trusted_device: true });
    expect(line.extraInfo.user_id).toBe(7);
    noSecrets();
  });

  it('AC-26: a login that needs 2FA gives "Login requires 2FA" and no success line', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(
      dbUser({ twofa_enabled: true, twofa_code: 'hash', twofa_expires_at: new Date(Date.now() + 10 * 60 * 1000) }),
    );
    devices.getOneOrCreate.mockResolvedValue({ id: 21, disabled: true, blocked_at: null });
    await service.login({ email: EMAIL, password: PASSWORD } as any);
    expect(audit('Login requires 2FA')).toHaveLength(1);
    expect(audit('Login succeeded')).toHaveLength(0);
  });

  it('AC-26: a blocked device gives {device_blocked}', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(dbUser());
    devices.getOneOrCreate.mockResolvedValue({ id: 21, disabled: false, blocked_at: new Date() });
    await expect(service.login({ email: EMAIL, password: PASSWORD } as any)).rejects.toThrow();
    expect(audit('Login rejected')[0].extraInfo).toEqual({ user_id: 7, reason: 'device_blocked' });
  });

  it('AC-26: a wrong 2FA code gives warn "2FA verification failed" {attempts:1}', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(
      dbUser({ twofa_enabled: true, twofa_code: await hash('111111'), twofa_expires_at: new Date(Date.now() + 600000), twofa_attempts: 0 }),
    );
    await expect(service.verify2fa({ email: EMAIL, twofa_code: TWOFA } as any)).rejects.toThrow();
    const [line] = audit('2FA verification failed');
    expect(line.level).toBe('WARN');
    expect(line.extraInfo).toMatchObject({ attempts: 1, code_burned: false });
    expect(typeof line.extraInfo.max_attempts).toBe('number');
    noSecrets();
  });

  it('AC-26: a correct 2FA code logs in with {method:twofa}', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(
      dbUser({ twofa_enabled: true, twofa_code: await hash(TWOFA), twofa_expires_at: new Date(Date.now() + 600000) }),
    );
    devices.getOneOrCreate.mockResolvedValue({ id: 21, disabled: true, blocked_at: null });
    devices.update.mockResolvedValue({});
    await service.verify2fa({ email: EMAIL, twofa_code: TWOFA } as any);
    expect(audit('Login succeeded')[0].method).toBe('twofa');
    noSecrets();
  });

  it('AC-26: password recovery with an unknown account never logs the email', async () => {
    userRepository.findOneBy.mockResolvedValue(null);
    await expect(service.passwordRecovery({ email: EMAIL } as any)).rejects.toThrow();
    const [line] = audit('Password recovery rejected');
    expect(line.extraInfo).toEqual({ reason: 'unknown_account' });
    noSecrets();
  });

  it('AC-26: recovery code validated and password reset completed carry the user id, never the code', async () => {
    const attempt = { id: 3, code_validated: true, expires_at: new Date(Date.now() + 600000), user: { id: 7 } };
    recoveryAttempts.findOneByCode.mockResolvedValue(attempt);
    recoveryAttempts.update.mockResolvedValue({});
    await service.checkPasswordRecoveryAttempt({ code: RECOVERY_CODE } as any);
    await service.updatePassword({ code: RECOVERY_CODE, password: 'NEWPASSWORD456' } as any);
    const validated = audit('Password recovery code validated')[0];
    const reset = audit('Password reset completed')[0];
    expect(validated.extraInfo.user_id).toBe(7);
    expect(reset.extraInfo).toEqual({ user_id: 7, sessions_revoked: 'all' });
    expect(reset.extraInfo.user_id).toBe(7);
    expect(JSON.stringify(lines)).not.toContain('NEWPASSWORD456');
    noSecrets();
  });

  it('AC-26: invalid, expired and not-validated recovery codes each give their reason', async () => {
    recoveryAttempts.findOneByCode.mockResolvedValueOnce(null);
    await expect(service.checkPasswordRecoveryAttempt({ code: RECOVERY_CODE } as any)).rejects.toThrow();
    recoveryAttempts.findOneByCode.mockResolvedValueOnce({ id: 1, code_validated: false, expires_at: new Date(Date.now() + 1000), user: { id: 7 } });
    await expect(service.updatePassword({ code: RECOVERY_CODE, password: 'x' } as any)).rejects.toThrow();
    recoveryAttempts.findOneByCode.mockResolvedValueOnce({ id: 1, code_validated: true, expires_at: new Date(Date.now() - 1000), user: { id: 7 } });
    await expect(service.updatePassword({ code: RECOVERY_CODE, password: 'x' } as any)).rejects.toThrow();
    expect(audit('Password recovery rejected').map((l) => l.extraInfo.reason)).toEqual(['invalid_code', 'not_validated', 'expired']);
    noSecrets();
  });

  it('AC-26: logout gives info "Logged out" with the session id', async () => {
    requestService.user = { id: 7, token: JWT };
    sessions.findOneBySession.mockResolvedValue({ id: 99 });
    sessions.update.mockResolvedValue({});
    await service.logout();
    const [line] = audit('Logged out');
    expect(line.extraInfo).toEqual({ user_id: 7, session_id: 99 });
    expect(line.extraInfo.user_id).toBe(7);
    noSecrets();
  });

  it('AC-26: a refresh without a request user gives warn {no_user}; an untrusted device gives {device_untrusted}', async () => {
    delete requestService.user;
    await expect(service.refreshToken()).rejects.toThrow();
    requestService.user = { id: 7, email: EMAIL, token: JWT };
    devices.getOneByAuthDevice.mockResolvedValue({ id: 21, disabled: true, blocked_at: null });
    await expect(service.refreshToken()).rejects.toThrow();
    const reasons = audit('Session refresh rejected');
    expect(reasons.map((l) => l.extraInfo.reason)).toEqual(['no_user', 'device_untrusted']);
    expect('correlation' in reasons[0]).toBe(false);
    expect(reasons[1].extraInfo.user_id).toBe(7);
    noSecrets();
  });

  it('Round 1: a failed 2FA email logs a masked error_message, never the recipient or a stack', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(dbUser({ twofa_enabled: true }));
    devices.getOneOrCreate.mockResolvedValue({ id: 21, disabled: true, blocked_at: null });
    mailSend.mockRejectedValue(Object.assign(new Error('550 <ross@example.com> rejected, also alice@ssl.example.org'), { stack: 'Error at ross@example.com' }));
    await service.login({ email: EMAIL, password: PASSWORD } as any);
    await new Promise((r) => setImmediate(r));
    const [line] = audit('Failed to send 2FA email');
    expect(line.level).toBe('ERROR');
    expect(line.extraInfo.error_message).toContain('[email]');
    const dumped = JSON.stringify(lines);
    expect(dumped).not.toMatch(/ross@example.com|alice@ssl.example.org/);
    noSecrets();
  });

  it('AC-26: nothing is printed outside the structured logger', async () => {
    userRepository.findOneByWithSecrets.mockResolvedValue(null);
    await service.login({ email: EMAIL, password: PASSWORD } as any).catch(() => undefined);
    expect(stray).toEqual([]);
  });
});
