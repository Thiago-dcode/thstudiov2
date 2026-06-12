jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
  stripeWebhookSecret: '',
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

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: UserAuthDevicesService, useValue: {} },
        { provide: RequestService, useValue: {} },
        { provide: UserSessionsService, useValue: {} },
        { provide: MailService, useValue: {} },
        { provide: TwoFAMail, useValue: {} },
        { provide: PasswordRecoveryMail, useValue: {} },
        { provide: PasswordRecoveryAttemptsService, useValue: {} },
        { provide: EventEmitter2, useValue: {} },
        { provide: RoleService, useValue: {} },
        { provide: InvitationLinkService, useValue: {} },
        { provide: UserBenefitService, useValue: {} },
        { provide: WaitListService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
