jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
  stripeWebhookSecret: '',
}));
// The real helper dynamic-imports `uuid`, which Jest can't run without VM modules.
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'public-uuid'),
}));
// The real lock talks to Redis, which unit tests don't run; without this mock the 2FA verify test
// timed out at 30 s. Run the critical section directly. A plain function, not jest.fn: the
// beforeEach calls jest.resetAllMocks(), which would clear a jest.fn implementation.
jest.mock('src/common/utils/user-lock', () => ({
  ...jest.requireActual('src/common/utils/user-lock'),
  withUserLock: async (_key: string, _ttlMs: number, fn: () => Promise<unknown>) => fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthService } from './auth.service';
import { UserRepository } from '../users/users.repository';
import { UserAuthDevicesService } from '../user-auth-devices/user-auth-devices.service';
import { RequestService } from 'src/common/services/request.service';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { TwoFAMail } from './mails/twofa-mail';
import { PasswordRecoveryMail } from './mails/password-recovery-mail';
import { PasswordRecoveryAttemptsService } from './password-recovery-attempts/password-recovery-attempts.service';
import { RoleService } from '../roles/roles.service';
import { InvitationLinkService } from '../invitation-links/invitation-link.service';
import { UserBenefitService } from '../user-benefit/user-benefit.service';
import { WaitListService } from '../wait-list/wait-list.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { hash } from '@repo/common-lib/utils/hash';
import { UsernameHistoryRepository } from '../username-history/username-history.repository';

describe('AuthService', () => {
  let service: AuthService;
  let moduleRef: TestingModule;

  const user = { id: 7, email: 'ana@example.com', language: 'EN', twofa_enabled: true, email_validated: false };
  const waitList = { id: 3, email: 'ana@example.com', validated_at: new Date(), status: 'INVITED' };
  const invitationLink = { id: 11, benefit_id: null, current_uses: 0, max_uses: 1 };
  const preValidatedDevice = { id: 21, user_id: 7, user_agent: 'UA', ip_address: '1.2.3.4', disabled: false, blocked_at: null };
  const registerRequest = { email: 'ana@example.com', username: 'ana', password: 'secret-password', invitation_code: 'code' };

  const userRepository = {
    create: jest.fn(),
    updateById: jest.fn(),
    findOneByWithSecrets: jest.fn(),
    findOneBy: jest.fn(),
  };
  const userAuthDevicesService = {
    claimPreValidated: jest.fn(),
    getOneOrCreate: jest.fn(),
    update: jest.fn(),
    getOneByAuthDevice: jest.fn(),
  };
  const userSessionsService = { handleSessionProcess: jest.fn(), sessionExists: jest.fn() };
  const requestService: Record<string, unknown> = {};
  const invitationLinkService = {
    validateCode: jest.fn(),
    updateById: jest.fn(),
    claimUse: jest.fn(),
    releaseUse: jest.fn(),
  };
  const waitListService = { findByInvitationLinkId: jest.fn(), findByEmail: jest.fn(), updateById: jest.fn() };
  const mailService = { send: jest.fn() };
  const usernameHistoryRepository = { isReservedForOtherUser: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    for (const key of Object.keys(requestService)) delete requestService[key];
    Object.assign(requestService, { user_agent: 'UA', ip_address: '1.2.3.4', language: 'EN' });
    userRepository.create.mockResolvedValue(user);
    userRepository.updateById.mockImplementation(async (_id, data) => ({ ...user, ...data }));
    invitationLinkService.validateCode.mockResolvedValue(invitationLink);
    invitationLinkService.claimUse.mockResolvedValue(true);
    waitListService.findByInvitationLinkId.mockResolvedValue(waitList);
    userAuthDevicesService.getOneOrCreate.mockResolvedValue({ ...preValidatedDevice, disabled: true });
    mailService.send.mockResolvedValue(undefined);
    usernameHistoryRepository.isReservedForOtherUser.mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: UserAuthDevicesService, useValue: userAuthDevicesService },
        { provide: RequestService, useValue: requestService },
        { provide: UserSessionsService, useValue: userSessionsService },
        { provide: MailService, useValue: mailService },
        { provide: TwoFAMail, useValue: { setUser: jest.fn() } },
        { provide: PasswordRecoveryMail, useValue: {} },
        { provide: PasswordRecoveryAttemptsService, useValue: {} },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: RoleService, useValue: { getByName: jest.fn().mockResolvedValue({ id: 2 }) } },
        { provide: InvitationLinkService, useValue: invitationLinkService },
        { provide: UserBenefitService, useValue: { create: jest.fn() } },
        { provide: WaitListService, useValue: waitListService },
        { provide: LogService, useValue: { info: jest.fn(), error: jest.fn() } },
        { provide: UsernameHistoryRepository, useValue: usernameHistoryRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    moduleRef = module;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    // Wait-list links used to be created without an expiry, so an EXPIRED invite still
    // registered and claimed its tier's benefit.
    it.each([
      ['an expired entry', { status: 'EXPIRED' }],
      ['an invite past its window', { expires_at: new Date(Date.now() - 1000) }],
    ])('rejects the invitation of %s', async (_label, entry) => {
      waitListService.findByInvitationLinkId.mockResolvedValue({ ...waitList, ...entry });

      await expect(service.register(registerRequest as never)).rejects.toThrow('This invitation has expired');
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('refuses a username another artist moved away from in the last 90 days', async () => {
      usernameHistoryRepository.isReservedForOtherUser.mockResolvedValue(true);

      await expect(service.register(registerRequest as never)).rejects.toThrow('Username is already taken');
      expect(usernameHistoryRepository.isReservedForOtherUser).toHaveBeenCalledWith('ana');
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(invitationLinkService.claimUse).not.toHaveBeenCalled();
    });

    it('refuses an invitation another registration used up in the meantime', async () => {
      invitationLinkService.claimUse.mockResolvedValue(false);

      await expect(service.register(registerRequest as never)).rejects.toThrow('already been used');
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('gives the use back when the account cannot be created', async () => {
      userRepository.create.mockRejectedValueOnce(new Error('duplicate'));

      await expect(service.register(registerRequest as never)).rejects.toThrow('duplicate');
      expect(invitationLinkService.releaseUse).toHaveBeenCalledWith(invitationLink.id);
    });

    it('logs in without a 2FA code when this browser validated the wait-list email', async () => {
      userAuthDevicesService.claimPreValidated.mockResolvedValue(preValidatedDevice);

      const result = await service.register(registerRequest as never);

      expect(userAuthDevicesService.claimPreValidated).toHaveBeenCalledWith({
        email: waitList.email,
        user_id: user.id,
        user_agent: 'UA',
        ip_address: '1.2.3.4',
      });
      expect(userRepository.updateById).toHaveBeenCalledWith(user.id, expect.objectContaining({ email_validated: true }));
      expect(result).toMatchObject({ token: 'jwt-token', need_twofa: false });
      expect(userSessionsService.handleSessionProcess).toHaveBeenCalled();
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('falls back to the 2FA code when the device does not match', async () => {
      userAuthDevicesService.claimPreValidated.mockResolvedValue(null);

      const result = await service.register(registerRequest as never);

      expect(result).toMatchObject({ token: null, need_twofa: true });
      expect(mailService.send).toHaveBeenCalled();
      expect(userRepository.updateById).not.toHaveBeenCalledWith(user.id, expect.objectContaining({ email_validated: true }));
    });

    it('never tries the shortcut without a validated wait-list entry from the invitation', async () => {
      invitationLinkService.validateCode.mockResolvedValue(null);
      waitListService.findByEmail.mockResolvedValue(null);

      const result = await service.register({ ...registerRequest, invitation_code: undefined } as never);

      expect(userAuthDevicesService.claimPreValidated).not.toHaveBeenCalled();
      expect(result).toMatchObject({ token: null, need_twofa: true });
    });

    it('untrusts a claimed device and sends the code when the login step fails', async () => {
      userAuthDevicesService.claimPreValidated.mockResolvedValue(preValidatedDevice);
      userSessionsService.handleSessionProcess.mockRejectedValueOnce(new Error('db down'));
      userAuthDevicesService.update.mockResolvedValue(undefined);

      const result = await service.register(registerRequest as never);

      expect(userAuthDevicesService.update).toHaveBeenCalledWith(preValidatedDevice.id, { disabled: true });
      expect(result).toMatchObject({ token: null, need_twofa: true });
      expect(mailService.send).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const device = { id: 21, disabled: false, blocked_at: null };
    beforeEach(() => {
      // The token was signed at sign-in: funnel not done, no Stripe customer yet.
      requestService.user = {
        ...user,
        email_validated: true,
        token: 'old-token',
        funnel_step: 1,
        stripe_customer_id: null,
      };
      userAuthDevicesService.getOneByAuthDevice.mockResolvedValue(device);
      userSessionsService.sessionExists.mockResolvedValue(true);
    });

    it('re-signs from the database so the new token is not a copy of the stale one', async () => {
      userRepository.findOneBy.mockResolvedValue({
        ...user,
        email_validated: true,
        banned: false,
        funnel_step: 6,
        stripe_customer_id: 'cus_db',
      });
      const jwt = moduleRef.get(JwtService) as unknown as { signAsync: jest.Mock };

      const result = await service.refreshToken();

      expect(userRepository.findOneBy).toHaveBeenCalledWith('id', user.id);
      expect(result).toMatchObject({ funnel_step: 6, stripe_customer_id: 'cus_db', token: 'jwt-token' });
      expect(jwt.signAsync.mock.calls[0][0]).toMatchObject({ funnel_step: 6, stripe_customer_id: 'cus_db' });
    });

    it('refuses to refresh a session of a since-banned account', async () => {
      userRepository.findOneBy.mockResolvedValue({ ...user, email_validated: true, banned: true });
      await expect(service.refreshToken()).rejects.toThrow();
      expect(userSessionsService.handleSessionProcess).not.toHaveBeenCalled();
    });
  });

  describe('2FA codes', () => {
    const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000);
    const storedUser = async (overrides: Record<string, unknown> = {}) => ({
      ...user,
      email_validated: true,
      banned: false,
      password: await hash('secret-password'),
      twofa_code: await hash('123456'),
      twofa_expires_at: minutesFromNow(8),
      twofa_attempts: 0,
      ...overrides,
    });
    const login = () => service.login({ email: user.email, password: 'secret-password' } as never);

    it('reuses a pending code on login instead of emailing a new one', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(await storedUser());

      const result = await login();

      expect(result).toMatchObject({ token: null, need_twofa: true });
      expect(mailService.send).not.toHaveBeenCalled();
      expect(userRepository.updateById).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty('twofa_code');
      expect(result).not.toHaveProperty('twofa_attempts');
    });

    it('emails a fresh 6-digit code when the pending one is about to expire', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(
        await storedUser({ twofa_expires_at: minutesFromNow(1) }),
      );

      await login();

      expect(mailService.send).toHaveBeenCalledTimes(1);
      expect(userRepository.updateById).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ twofa_attempts: 0, twofa_code: expect.any(String) }),
      );
      const twoFAMail = moduleRef.get(TwoFAMail) as unknown as { setUser: jest.Mock };
      expect(twoFAMail.setUser.mock.calls[0][0].twofa_code).toMatch(/^\d{6}$/);
    });

    it('refuses a resend inside the cooldown', async () => {
      // Issued 30s ago (expires in 9m30s).
      userRepository.findOneByWithSecrets.mockResolvedValue(
        await storedUser({ twofa_expires_at: new Date(Date.now() + 9.5 * 60_000) }),
      );

      await expect(service.resend2fa({ email: user.email })).rejects.toThrow(/wait/);
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('resends a new code once the cooldown has passed', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(await storedUser());

      const result = await service.resend2fa({ email: user.email });

      expect(result).toMatchObject({ token: null, need_twofa: true });
      expect(mailService.send).toHaveBeenCalledTimes(1);
    });

    it('rejects a resend for an unknown or banned account', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(await storedUser({ banned: true }));
      await expect(service.resend2fa({ email: user.email })).rejects.toThrow('Invalid credentials');
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('counts failed codes and burns the code at the limit', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(await storedUser({ twofa_attempts: 2 }));

      await expect(
        service.verify2fa({ email: user.email, twofa_code: '000000' } as never),
      ).rejects.toThrow();

      expect(userRepository.updateById).toHaveBeenCalledWith(user.id, {
        twofa_attempts: 0,
        twofa_code: null,
        twofa_expires_at: null,
      });
    });
  });

  describe('password recovery', () => {
    const attempt = {
      id: 5,
      user_id: user.id,
      user: { id: user.id },
      code: 'secret-recovery-code',
      code_validated: false,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      updated_at: new Date(),
    };
    let attempts: Record<string, jest.Mock>;

    beforeEach(() => {
      attempts = Object.assign(moduleRef.get(PasswordRecoveryAttemptsService), {
        findOneNotExpiredByUserId: jest.fn().mockResolvedValue(null),
        expireAllUserAttempts: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(attempt),
        findOneByCode: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      });
      Object.assign(moduleRef.get(PasswordRecoveryMail), { setData: jest.fn() });
      userRepository.findOneBy.mockResolvedValue(user);
      Object.assign(userSessionsService, { expireAllForUser: jest.fn().mockResolvedValue(undefined) });
    });

    // The code reaches the owner only through the emailed link. Returning it made any
    // known email enough to reset that account's password.
    it('never returns the recovery code to the requester', async () => {
      const result = await service.passwordRecovery({ email: user.email } as never);

      expect(JSON.stringify(result)).not.toContain(attempt.code);
      expect(result).not.toHaveProperty('code');
      expect(result).toEqual({
        code_validated: false,
        expires_at: attempt.expires_at,
        updated_at: attempt.updated_at,
      });
    });

    it('ends every existing session when the password is reset', async () => {
      attempts.findOneByCode.mockResolvedValue({ ...attempt, code_validated: true });

      await service.updatePassword({ code: attempt.code, password: 'new-password' } as never);

      expect(userSessionsService.expireAllForUser).toHaveBeenCalledWith(user.id);
    });
  });
});
