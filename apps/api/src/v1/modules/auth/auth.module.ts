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

@Module({
  imports: [UserAuthDevicesModule, UserSessionsModule, PasswordRecoveryAttemptsModule],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, JwtService, TwoFAMail, PasswordRecoveryMail],
})
export class AuthModule {}
