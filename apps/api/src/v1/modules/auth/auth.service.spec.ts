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
import { UserService } from '../users/users.service';
import { GoogleOauth2Service } from '@repo/backend-lib/services/googleapi-service';
import { UserOauthProvidersService } from '../user-oauth-providers/user-oauth-providers.service';
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
import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DbUniqueViolationException } from '@repo/database/exceptions';
import { UsernameHistoryRepository } from '../username-history/username-history.repository';
import { hash } from '@repo/common-lib/utils/hash';

describe('AuthService', () => {
  let service: AuthService;
  const logService = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    critical: jest.fn(),
  };
  let moduleRef: TestingModule;

  const user = { id: 7, email: 'ana@example.com', language: 'EN', twofa_enabled: true, email_validated: false };
  const waitList = { id: 3, email: 'ana@example.com', validated_at: new Date(), status: 'INVITED' };
  const invitationLink = { id: 11, benefit_id: null, current_uses: 0, max_uses: 1 };
  const preValidatedDevice = { id: 21, user_id: 7, user_agent: 'UA', ip_address: '1.2.3.4', disabled: false, blocked_at: null };
  const registerRequest = { email: 'ana@example.com', password: 'secret-password', invitation_code: 'code' };

  const userRepository = {
    create: jest.fn(),
    updateById: jest.fn(),
    findOneByWithSecrets: jest.fn(),
    findOneBy: jest.fn(),
    importProviderAvatar: jest.fn(),
    generateUniqueUsername: jest.fn(),
    findOneCompacted: jest.fn(),
    deleteAccount: jest.fn(),
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
  const googleOauth2Service = { getUserInfo: jest.fn() };
  const userOauthProvidersService = { findByProviderUserId: jest.fn(), upsert: jest.fn() };
  const usernameHistoryRepository = { isReservedForOtherUser: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    for (const key of Object.keys(requestService)) delete requestService[key];
    Object.assign(requestService, {
      user_agent: 'UA',
      ip_address: '1.2.3.4',
      language: 'EN',
      log: () => logService,
      traceCarrier: () => ({ service: 'api' }),
    });
    userRepository.create.mockResolvedValue(user);
    userRepository.updateById.mockImplementation(async (_id, data) => ({ ...user, ...data }));
    invitationLinkService.validateCode.mockResolvedValue(invitationLink);
    invitationLinkService.claimUse.mockResolvedValue(true);
    waitListService.findByInvitationLinkId.mockResolvedValue(waitList);
    userAuthDevicesService.getOneOrCreate.mockResolvedValue({ ...preValidatedDevice, disabled: true });
    mailService.send.mockResolvedValue(undefined);
    userRepository.generateUniqueUsername.mockResolvedValue('artistab12cd34');
    userRepository.findOneCompacted.mockResolvedValue({ ...user, username: 'artistab12cd34', name: null });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userRepository },
        { provide: GoogleOauth2Service, useValue: googleOauth2Service },
        { provide: UserOauthProvidersService, useValue: userOauthProvidersService },
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

    it('refuses an invitation another registration used up in the meantime', async () => {
      invitationLinkService.claimUse.mockResolvedValue(false);

      await expect(service.register(registerRequest as never)).rejects.toThrow('already been used');
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    describe('an invitation addressed to one email', () => {
      const withRegistrationClosed = async (closed: boolean, fn: () => Promise<void>) => {
        const previous = process.env.REGISTRATION_IS_CLOSED;
        process.env.REGISTRATION_IS_CLOSED = closed ? '1' : '0';
        try {
          await fn();
        } finally {
          if (previous === undefined) delete process.env.REGISTRATION_IS_CLOSED;
          else process.env.REGISTRATION_IS_CLOSED = previous;
        }
      };

      beforeEach(() => {
        // Admin invitations come with no wait-list entry: the link's own email is the only check.
        waitListService.findByInvitationLinkId.mockResolvedValue(null);
        waitListService.findByEmail.mockResolvedValue(null);
      });

      it.each([true, false])(
        'refuses another email without using the link up (registration closed: %s)',
        async (closed) => {
          invitationLinkService.validateCode.mockResolvedValue({ ...invitationLink, email: 'invited@example.com' });

          await withRegistrationClosed(closed, async () => {
            await expect(service.register(registerRequest as never)).rejects.toMatchObject({
              API_ERROR_CODE: 'REGISTRATION_INVITATION_EMAIL_MISMATCH',
            });
          });
          expect(invitationLinkService.claimUse).not.toHaveBeenCalled();
          expect(userRepository.create).not.toHaveBeenCalled();
          expect(logService.warn).toHaveBeenCalledWith(
            'Registration rejected',
            expect.objectContaining({ reason: 'invitation_email_mismatch', invitation_link_id: invitationLink.id, operation: 'register' }),
          );
        },
      );

      it('accepts the invited email whatever its case', async () => {
        invitationLinkService.validateCode.mockResolvedValue({ ...invitationLink, email: ' Ana@Example.com' });

        await withRegistrationClosed(true, async () => {
          await expect(service.register(registerRequest as never)).resolves.toBeDefined();
        });
        expect(invitationLinkService.claimUse).toHaveBeenCalledWith(invitationLink.id);
        expect(userRepository.create).toHaveBeenCalled();
      });

      it('lets any email use a link with no email', async () => {
        invitationLinkService.validateCode.mockResolvedValue({ ...invitationLink, email: null });

        await withRegistrationClosed(true, async () => {
          await expect(service.register(registerRequest as never)).resolves.toBeDefined();
        });
        expect(invitationLinkService.claimUse).toHaveBeenCalledWith(invitationLink.id);
      });
    });

    it('gives the use back and alerts when the account cannot be created for an unknown reason', async () => {
      userRepository.create.mockRejectedValueOnce(new Error('boom'));

      await expect(service.register(registerRequest as never)).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(invitationLinkService.releaseUse).toHaveBeenCalledWith(invitationLink.id);
      expect(logService.critical).toHaveBeenCalledWith(
        'Account creation failed unexpectedly',
        expect.objectContaining({ step: 'create-user', error_name: 'Error', operation: 'register' }),
      );
    });

    it('answers 409 and alerts when a concurrent sign-up took the email or username', async () => {
      userRepository.create.mockRejectedValueOnce(new DbUniqueViolationException('dup', 'users_email_unique'));

      await expect(service.register(registerRequest as never)).rejects.toBeInstanceOf(ConflictException);
      expect(invitationLinkService.releaseUse).toHaveBeenCalledWith(invitationLink.id);
      // Kept `critical` on purpose: a duplicate past the request validation is worth a look.
      expect(logService.critical).toHaveBeenCalledWith(
        'Account creation failed',
        expect.objectContaining({ reason: 'duplicate', operation: 'register' }),
      );
    });

    it('keeps the created account and alerts when the wait-list redeem fails afterwards', async () => {
      waitListService.updateById.mockRejectedValueOnce(new Error('db down'));

      await expect(service.register(registerRequest as never)).resolves.toBeDefined();
      expect(invitationLinkService.releaseUse).not.toHaveBeenCalled();
      expect(logService.critical).toHaveBeenCalledWith(
        'Account created but wait-list entry not redeemed',
        expect.objectContaining({ step: 'wait-list', user_id: user.id, operation: 'register' }),
      );
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
      // Open registration: a local `.env` with REGISTRATION_IS_CLOSED=1 would refuse this sign-up.
      const previous = process.env.REGISTRATION_IS_CLOSED;
      process.env.REGISTRATION_IS_CLOSED = '0';
      try {
        const result = await service.register({ ...registerRequest, invitation_code: undefined } as never);

        expect(userAuthDevicesService.claimPreValidated).not.toHaveBeenCalled();
        expect(result).toMatchObject({ token: null, need_twofa: true });
      } finally {
        if (previous === undefined) delete process.env.REGISTRATION_IS_CLOSED;
        else process.env.REGISTRATION_IS_CLOSED = previous;
      }
    });

    it('AC-1: generates an artist username and flags it auto-generated', async () => {
      await service.register(registerRequest as never);

      expect(userRepository.generateUniqueUsername).toHaveBeenCalledWith('ARTIST');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'artistab12cd34', username_auto_generated: true }),
      );
    });

    it('AC-1: a stray username in the body never reaches the account', async () => {
      await service.register({ ...registerRequest, username: 'sneaky' } as never);

      const [payload] = userRepository.create.mock.calls[0];
      expect(payload.username).toBe('artistab12cd34');
      expect(payload.username_auto_generated).toBe(true);
    });

    it('AC-1: the register DTO strips a username and declares none', async () => {
      const { plainToInstance } = await import('class-transformer');
      const { validate } = await import('class-validator');
      const { RegisterRequest } = await import('./requests/register.request');

      const dto = plainToInstance(RegisterRequest, {
        email: 'ana@example.com',
        password: 'secret-password1',
        username: 'sneaky',
      });
      await validate(dto, { whitelist: true, forbidNonWhitelisted: false }).catch(() => undefined);

      expect(dto).not.toHaveProperty('username');
      expect(dto).toMatchObject({ email: 'ana@example.com' });
    });

    it('AC-2: register never asks the username history whether a name is reserved', async () => {
      // `generateUniqueUsername` (the user service) avoids reserved names on its own.
      await service.register(registerRequest as never);

      expect(usernameHistoryRepository.isReservedForOtherUser).not.toHaveBeenCalled();
      expect(userRepository.generateUniqueUsername).toHaveBeenCalledTimes(1);
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

    it('Fix 1: the 2FA mail greets by the profile name and never gets the username', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(await storedUser());
      userRepository.findOneCompacted.mockResolvedValue({ ...user, username: 'anasilva4k2m9q1x', name: 'Ana' });

      await service.resend2fa({ email: user.email });

      const twoFAMail = moduleRef.get(TwoFAMail) as unknown as { setUser: jest.Mock };
      expect(userRepository.findOneCompacted).toHaveBeenCalledWith(user.id);
      const [mailUser, lang] = twoFAMail.setUser.mock.calls[0];
      expect(mailUser).toEqual({ email: user.email, name: 'Ana', twofa_code: expect.stringMatching(/^\d{6}$/) });
      expect(lang).toBe('EN');
    });

    it('Fix 1: without a name the 2FA mail gets name null (nameless greeting)', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(await storedUser());

      await service.resend2fa({ email: user.email });

      const twoFAMail = moduleRef.get(TwoFAMail) as unknown as { setUser: jest.Mock };
      expect(twoFAMail.setUser.mock.calls[0][0]).toMatchObject({ name: null });
      expect(twoFAMail.setUser.mock.calls[0][0]).not.toHaveProperty('username');
    });

    it('Fix 1: a failed name read still sends the code, with the nameless greeting', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(await storedUser());
      userRepository.findOneCompacted.mockRejectedValue(new Error('db down'));

      await service.resend2fa({ email: user.email });

      expect(mailService.send).toHaveBeenCalledTimes(1);
      const twoFAMail = moduleRef.get(TwoFAMail) as unknown as { setUser: jest.Mock };
      expect(twoFAMail.setUser.mock.calls[0][0]).toMatchObject({ name: null });
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

    it('Fix 1: the recovery mail greets by the profile name, never the username', async () => {
      userRepository.findOneCompacted.mockResolvedValue({ ...user, username: 'artistab12cd34', name: 'Ana' });

      await service.passwordRecovery({ email: user.email } as never);

      const mail = moduleRef.get(PasswordRecoveryMail) as unknown as { setData: jest.Mock };
      expect(mail.setData).toHaveBeenCalledWith({ email: user.email, name: 'Ana' }, attempt, 'EN');
    });

    it('Fix 1: without a name the recovery mail gets name null', async () => {
      await service.passwordRecovery({ email: user.email } as never);

      const mail = moduleRef.get(PasswordRecoveryMail) as unknown as { setData: jest.Mock };
      expect(mail.setData).toHaveBeenCalledWith({ email: user.email, name: null }, attempt, 'EN');
    });

    it('ends every existing session when the password is reset', async () => {
      attempts.findOneByCode.mockResolvedValue({ ...attempt, code_validated: true });

      await service.updatePassword({ code: attempt.code, password: 'new-password' } as never);

      expect(userSessionsService.expireAllForUser).toHaveBeenCalledWith(user.id);
    });
  });

  describe('handleOauth2Callback: new account', () => {
    const callback = {
      provider: 'google',
      code: 'auth-code',
      redirect_uri: 'http://localhost:3000/api/oauth2/google/callback',
      code_verifier: 'v'.repeat(43),
      invitation_code: 'code',
    } as never;
    const profile = { id: 'google-sub-2', email: 'new@example.com', verified_email: true };
    const created = { ...user, id: 12, email: 'new@example.com', email_validated: true, banned: false };

    beforeEach(() => {
      userOauthProvidersService.findByProviderUserId.mockResolvedValue(null);
      userOauthProvidersService.upsert.mockResolvedValue({});
      // No account holds this email: the 404 is the sign-up case.
      userRepository.findOneBy.mockRejectedValue(new NotFoundException('User not found'));
      userRepository.create.mockResolvedValue(created);
      waitListService.findByInvitationLinkId.mockResolvedValue(null);
      userAuthDevicesService.getOneOrCreate.mockResolvedValue({ ...preValidatedDevice, user_id: 12, disabled: false });
      userSessionsService.handleSessionProcess.mockResolvedValue(undefined);
    });

    const signUpWith = async (extra: Record<string, unknown>) => {
      googleOauth2Service.getUserInfo.mockResolvedValue({
        profile: { ...profile, ...extra },
        refreshToken: 'rt',
        scopes: [],
      });
      userRepository.generateUniqueUsername.mockImplementation(async (prefix: string) => `${prefix.toLowerCase()}zz99xx11`);
      await service.handleOauth2Callback(callback).catch(() => undefined);
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      return userRepository.create.mock.calls[0][0];
    };

    it('AC-3: a provider name keeps a name-based username and is still flagged auto-generated', async () => {
      const payload = await signUpWith({ given_name: 'Ana', family_name: 'Silva' });

      expect(userRepository.generateUniqueUsername).toHaveBeenCalledWith('Ana');
      expect(payload.username).toMatch(/^ana/);
      expect(payload.username_auto_generated).toBe(true);
    });

    it('AC-3: a given name alone is enough', async () => {
      const payload = await signUpWith({ given_name: 'Ana' });

      expect(payload.username_auto_generated).toBe(true);
    });

    it('AC-3: a surname alone is enough', async () => {
      const payload = await signUpWith({ family_name: 'Silva' });

      expect(userRepository.generateUniqueUsername).toHaveBeenCalledWith('Silva');
      expect(payload.username_auto_generated).toBe(true);
    });

    it('AC-3: no name and no surname gives an artist username flagged auto-generated', async () => {
      const payload = await signUpWith({});

      expect(userRepository.generateUniqueUsername).toHaveBeenCalledWith('ARTIST');
      expect(payload.username).toMatch(/^artist/);
      expect(payload.username_auto_generated).toBe(true);
    });

    it('AC-3: blank provider names count as no name', async () => {
      const payload = await signUpWith({ given_name: '  ', family_name: '' });

      expect(userRepository.generateUniqueUsername).toHaveBeenCalledWith('ARTIST');
      expect(payload.username_auto_generated).toBe(true);
    });

    it('Fix 2: a non-Latin name gives an artist username flagged auto-generated', async () => {
      const payload = await signUpWith({ given_name: 'Иван', family_name: 'Петров' });

      expect(userRepository.generateUniqueUsername).toHaveBeenCalledWith('ARTIST');
      expect(payload.username).toMatch(/^artist/);
      expect(payload.username_auto_generated).toBe(true);
    });

    it('Fix 2: a non-Latin given name falls through to a Latin surname', async () => {
      const payload = await signUpWith({ given_name: 'Иван', family_name: 'Silva' });

      expect(userRepository.generateUniqueUsername).toHaveBeenCalledWith('Silva');
      expect(payload.username_auto_generated).toBe(true);
    });
  });

  describe('handleOauth2Callback: already-linked account', () => {
    const linkedUser = { ...user, id: 9, public_id: '99999999-9999-4999-8999-999999999999', email: 'old@example.com', email_validated: true, banned: false };
    const profile = { id: 'google-sub-1', email: 'new@example.com', verified_email: true, given_name: 'Ana' };
    const callback = {
      provider: 'google',
      code: 'auth-code',
      redirect_uri: 'http://localhost:3000/api/oauth2/google/callback',
      code_verifier: 'v'.repeat(43),
    } as never;

    beforeEach(() => {
      googleOauth2Service.getUserInfo.mockResolvedValue({ profile, refreshToken: 'rt', scopes: [] });
      userOauthProvidersService.findByProviderUserId.mockResolvedValue({ id: 1, user_id: linkedUser.id });
      userOauthProvidersService.upsert.mockResolvedValue({});
      userRepository.findOneBy.mockResolvedValue(linkedUser);
      userAuthDevicesService.getOneOrCreate.mockResolvedValue({ ...preValidatedDevice, user_id: linkedUser.id, disabled: false });
      userSessionsService.handleSessionProcess.mockResolvedValue(undefined);
    });

    it('logs in the linked user by provider account id, with a device, never looking up the email', async () => {
      const result = await service.handleOauth2Callback(callback);

      // The exchange must reuse the authorization URL's redirect_uri, or Google rejects the code.
      // ...and send the PKCE verifier, so a leaked code alone cannot be redeemed.
      expect(googleOauth2Service.getUserInfo).toHaveBeenCalledWith(
        'auth-code',
        'http://localhost:3000/api/oauth2/google/callback',
        'v'.repeat(43),
      );
      expect(userOauthProvidersService.findByProviderUserId).toHaveBeenCalledWith('google', 'google-sub-1');
      expect(userRepository.findOneBy).toHaveBeenCalledTimes(1);
      expect(userRepository.findOneBy).toHaveBeenCalledWith('id', linkedUser.id);
      expect(userAuthDevicesService.getOneOrCreate).toHaveBeenCalledWith(expect.objectContaining({ user_id: linkedUser.id }));
      expect(userSessionsService.handleSessionProcess).toHaveBeenCalledWith(expect.objectContaining({ user_auth_device_id: preValidatedDevice.id }));
      expect(result).toMatchObject({ alreadyExist: true, auth: { id: linkedUser.id, token: 'jwt-token' } });
    });

    it('trusts an untrusted device on a linked Google sign-in', async () => {
      userAuthDevicesService.getOneOrCreate.mockResolvedValue({ ...preValidatedDevice, user_id: linkedUser.id, disabled: true });

      await service.handleOauth2Callback(callback);

      expect(userAuthDevicesService.update).toHaveBeenCalledWith(preValidatedDevice.id, { disabled: false });
    });

    it('rejects a banned linked user before saving anything', async () => {
      userRepository.findOneBy.mockResolvedValue({ ...linkedUser, banned: true, banned_reason: 'spam' });

      await expect(service.handleOauth2Callback(callback)).rejects.toMatchObject({ status: 401, message: 'spam' });
      expect(userOauthProvidersService.upsert).not.toHaveBeenCalled();
      expect(userAuthDevicesService.getOneOrCreate).not.toHaveBeenCalled();
    });

    it('rejects a blocked device with 403 before saving anything', async () => {
      userAuthDevicesService.getOneOrCreate.mockResolvedValue({ ...preValidatedDevice, blocked_at: new Date() });

      await expect(service.handleOauth2Callback(callback)).rejects.toMatchObject({ status: 403, message: 'Device is blocked' });
      expect(userOauthProvidersService.upsert).not.toHaveBeenCalled();
      expect(userSessionsService.handleSessionProcess).not.toHaveBeenCalled();
    });

    it('falls through to the email lookup when the provider account is not linked', async () => {
      userOauthProvidersService.findByProviderUserId.mockResolvedValue(null);
      userRepository.findOneBy.mockRejectedValue(new Error('stop-after-email-lookup'));

      await expect(service.handleOauth2Callback(callback)).rejects.toThrow('stop-after-email-lookup');
      expect(userRepository.findOneBy).toHaveBeenCalledWith('email', profile.email);
    });

    it('answers 401 with a warn, never a 5xx alert, when the code exchange fails', async () => {
      googleOauth2Service.getUserInfo.mockRejectedValue(
        Object.assign(new Error('invalid_grant'), { name: 'GaxiosError', response: { data: { error: 'invalid_grant' } } }),
      );

      await expect(service.handleOauth2Callback(callback)).rejects.toMatchObject({ status: 401, message: 'oauth_exchange_failed' });
      expect(logService.warn).toHaveBeenCalledWith(
        'Login rejected',
        expect.objectContaining({ reason: 'provider_exchange_failed', error_name: 'GaxiosError', provider_error: 'invalid_grant', operation: 'login' }),
      );
      expect(logService.critical).not.toHaveBeenCalled();
      expect(userOauthProvidersService.findByProviderUserId).not.toHaveBeenCalled();
    });

    it('looks the email up lowercased, as password sign-up stores it', async () => {
      googleOauth2Service.getUserInfo.mockResolvedValue({ profile: { ...profile, email: ' Ana@Example.COM ' }, scopes: [] });
      userOauthProvidersService.findByProviderUserId.mockResolvedValue(null);
      userRepository.findOneBy.mockRejectedValue(new Error('stop-after-email-lookup'));

      await expect(service.handleOauth2Callback(callback)).rejects.toThrow('stop-after-email-lookup');
      expect(userRepository.findOneBy).toHaveBeenCalledWith('email', 'ana@example.com');
    });

    it('rejects a banned unvalidated account instead of replacing it with a clean one', async () => {
      userOauthProvidersService.findByProviderUserId.mockResolvedValue(null);
      userRepository.findOneBy.mockResolvedValue({ ...linkedUser, email_validated: false, banned: true, banned_reason: 'spam' });

      // Generic message: the ban reason is the account owner's, not the Google user's to read.
      await expect(service.handleOauth2Callback(callback)).rejects.toMatchObject({ status: 401, message: 'Account permanently banned' });
      expect(invitationLinkService.claimUse).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('refuses a Google sign-up with an invitation addressed to another email, deleting nothing', async () => {
      userOauthProvidersService.findByProviderUserId.mockResolvedValue(null);
      // An unvalidated account holds the Google email: it must survive a rejected sign-up.
      userRepository.findOneBy.mockResolvedValue({ ...linkedUser, email: profile.email, email_validated: false });
      invitationLinkService.validateCode.mockResolvedValue({ ...invitationLink, email: 'invited@example.com' });
      waitListService.findByInvitationLinkId.mockResolvedValue(null);

      await expect(
        service.handleOauth2Callback({ ...(callback as object), invitation_code: 'code' } as never),
      ).rejects.toMatchObject({
        API_ERROR_CODE: 'REGISTRATION_INVITATION_EMAIL_MISMATCH',
      });
      expect(invitationLinkService.claimUse).not.toHaveBeenCalled();
      expect(userRepository.deleteAccount).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a linked account whose current email is unproven before trusting a device', async () => {
      userRepository.findOneBy.mockResolvedValue({ ...linkedUser, email_validated: false });

      await expect(service.handleOauth2Callback(callback)).rejects.toMatchObject({ status: 401 });
      expect(userAuthDevicesService.getOneOrCreate).not.toHaveBeenCalled();
      expect(userOauthProvidersService.upsert).not.toHaveBeenCalled();
    });

    it('does not import the picture again for an already-linked account', async () => {
      googleOauth2Service.getUserInfo.mockResolvedValue({
        profile: { ...profile, picture: 'https://lh3.googleusercontent.com/a/abc=s96-c' },
        scopes: [],
      });

      await service.handleOauth2Callback(callback);

      expect(userRepository.importProviderAvatar).not.toHaveBeenCalled();
    });

    it('imports the Google picture at 512px when linking by a validated email', async () => {
      googleOauth2Service.getUserInfo.mockResolvedValue({
        profile: { ...profile, picture: 'https://lh3.googleusercontent.com/a/abc=s96-c' },
        scopes: [],
      });
      userOauthProvidersService.findByProviderUserId.mockResolvedValue(null);

      await service.handleOauth2Callback(callback);

      expect(userRepository.importProviderAvatar).toHaveBeenCalledWith({
        user: { id: linkedUser.id, public_id: linkedUser.public_id },
        url: 'https://lh3.googleusercontent.com/a/abc=s512-c',
        provider: 'google',
        nameParts: ['Ana', undefined],
      });
    });

    it.each([
      'http://lh3.googleusercontent.com/a/abc',
      'https://evil.example.com/a.png',
      'https://googleusercontent.com.evil.example/a.png',
      'https://169.254.169.254/latest/meta-data',
      'not a url',
    ])('never fetches a picture outside Google image hosts: %s', async (picture) => {
      googleOauth2Service.getUserInfo.mockResolvedValue({ profile: { ...profile, picture }, scopes: [] });
      userOauthProvidersService.findByProviderUserId.mockResolvedValue(null);

      await service.handleOauth2Callback(callback);

      expect(userRepository.importProviderAvatar).not.toHaveBeenCalled();
    });

    it('returns 422 when Google gives no account id', async () => {
      googleOauth2Service.getUserInfo.mockResolvedValue({ profile: { ...profile, id: null }, scopes: [] });

      await expect(service.handleOauth2Callback(callback)).rejects.toMatchObject({ status: 422 });
      expect(userOauthProvidersService.findByProviderUserId).not.toHaveBeenCalled();
    });
  });
});
