import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { logConfig } from '@repo/backend-lib/config/logging';
import {
  FactoryLogService,
  LogService,
} from '@repo/backend-lib/services/log-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { UserAuthDevicesModule } from '../user-auth-devices/user-auth-devices.module';
import { PlansModule } from '../plans/plans.module';
import { CategoriesModule } from '../categories/categories.module';
import { AddressModule } from '../addresses/address.module';
import { AiModule } from '../ai/ai.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { ProfileStatusModule } from '../profile-status/profile-status.module';
import { AuthCoreModule } from '../auth/auth-core.module';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    NotifyNewUserMail,
    {
      provide: LogService,
      useFactory: () => {
        return FactoryLogService.createLogService('file', logConfig.users);
      },
    },
  ],
  imports: [
    UserExtraDataModule,
    ProfileStatusModule,
    UserAuthDevicesModule,
    PlansModule,
    CategoriesModule,
    AddressModule,
    AiModule,
    EmailPreferencesModule,
    // `PublicArtistGuard` resolves the owner's token on hidden accounts.
    AuthCoreModule,
    // Password change and ban end the user's other sessions.
    UserSessionsModule,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
