import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserRepository } from '../users/users.repository';
import { JwtService } from '@nestjs/jwt';
import { UserAuthDevicesModule } from '../user-auth-devices/user-auth-devices.module';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { TwoFAMail } from './mails/twofa-mail';
import { PasswordRecoveryAttemptsModule } from './password-recovery-attempts/password-recovery-attempts.module';
import { PasswordRecoveryMail } from './mails/password-recovery-mail';
import { RolesModule } from '../roles/roles.module';
import { InvitationLinkModule } from '../invitation-links/invitation-link.module';
import { UserBenefitModule } from '../user-benefit/user-benefit.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { WaitListModule } from '../wait-list/wait-list.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';

@Module({
  imports: [
    UserAuthDevicesModule,
    UserSessionsModule,
    PasswordRecoveryAttemptsModule,
    RolesModule,
    InvitationLinkModule,
    UserBenefitModule,
    WaitListModule,
    EmailPreferencesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    JwtService,
    TwoFAMail,
    PasswordRecoveryMail,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'auth',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
})
export class AuthModule {}
