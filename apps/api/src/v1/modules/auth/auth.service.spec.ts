jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
  stripeWebhookSecret: '',
}));
// The real helper dynamic-imports `uuid`, which Jest can't run without VM modules.
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'public-uuid'),
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

describe('AuthService', () => {
  let service: AuthService;
  let moduleRef: TestingModule;

  const user = { id: 7, email: 'ana@example.com', language: 'EN', twofa_enabled: true, email_validated: false };
  const waitList = { id: 3, email: 'ana@example.com', validated_at: new Date(), status: 'INVITED' };
  const invitationLink = { id: 11, benefit_id: null, current_uses: 0, max_uses: 1 };
  const preValidatedDevice = { id: 21, user_id: 7, user_agent: 'UA', ip_address: '1.2.3.4', disabled: false, blocked_at: null };
  const registerRequest = { email: 'ana@example.com', username: 'ana', password: 'secret-password', invitation_code: 'code' };

  const userRepository = { create: jest.fn(), updateById: jest.fn(), findOneByWithSecrets: jest.fn() };
  const userAuthDevicesService = { claimPreValidated: jest.fn(), getOneOrCreate: jest.fn(), update: jest.fn() };
  const userSessionsService = { handleSessionProcess: jest.fn() };
  const invitationLinkService = { validateCode: jest.fn(), updateById: jest.fn() };
  const waitListService = { findByInvitationLinkId: jest.fn(), findByEmail: jest.fn(), updateById: jest.fn() };
  const mailService = { send: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    userRepository.create.mockResolvedValue(user);
    userRepository.updateById.mockImplementation(async (_id, data) => ({ ...user, ...data }));
    invitationLinkService.validateCode.mockResolvedValue(invitationLink);
    waitListService.findByInvitationLinkId.mockResolvedValue(waitList);
    userAuthDevicesService.getOneOrCreate.mockResolvedValue({ ...preValidatedDevice, disabled: true });
    mailService.send.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token') } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: UserAuthDevicesService, useValue: userAuthDevicesService },
        { provide: RequestService, useValue: { user_agent: 'UA', ip_address: '1.2.3.4', language: 'EN' } },
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    moduleRef = module;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
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
});
