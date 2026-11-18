import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleOauth2Service } from '@repo/backend-lib/services/googleapi-service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../users/users.module';
import { UserAuthDevicesModule } from '../user-auth-devices/user-auth-devices.module';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { TwoFAMail } from './mails/twofa-mail';
import { PasswordRecoveryAttemptsModule } from './password-recovery-attempts/password-recovery-attempts.module';
import { PasswordRecoveryMail } from './mails/password-recovery-mail';
import { RolesModule } from '../roles/roles.module';
import { InvitationLinkModule } from '../invitation-links/invitation-link.module';
import { UserBenefitModule } from '../user-benefit/user-benefit.module';
import { WaitListModule } from '../wait-list/wait-list.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { AuthCoreModule } from './auth-core.module';
import { UserOauthProvidersModule } from '../user-oauth-providers/user-oauth-providers.module';

@Module({
  imports: [
    AuthCoreModule,
    UserAuthDevicesModule,
    UserSessionsModule,
    PasswordRecoveryAttemptsModule,
    RolesModule,
    InvitationLinkModule,
    UserBenefitModule,
    WaitListModule,
    EmailPreferencesModule,
    UserOauthProvidersModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TwoFAMail,
    PasswordRecoveryMail,
    {
      provide: GoogleOauth2Service,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new GoogleOauth2Service({
          clientId: configService.get('google.oauth.clientId'),
          clientSecret: configService.get('google.oauth.clientSecret'),
        }),
    },
  ],
  exports: [AuthCoreModule],
})
export class AuthModule { }
