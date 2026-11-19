import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { LogService } from '@repo/backend-lib/services/log-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { UserAuthDevicesModule } from '../user-auth-devices/user-auth-devices.module';
import { PlansModule } from '../plans/plans.module';
import { CategoriesModule } from '../categories/categories.module';
import { AddressModule } from '../addresses/address.module';
import { AiModule } from '../ai/ai.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { ProfileStatusModule } from '../profile-status/profile-status.module';
import { AuthCoreModule } from '../auth/auth-core.module';
import { AccountDeletionCodeMail } from './mails/account-deletion-code.mail';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { UsernameHistoryModule } from '../username-history/username-history.module';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    NotifyNewUserMail,
    AccountDeletionCodeMail,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({ channel: 'users' });
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
    // Old usernames: reserved for their owner and redirected to the current one.
    UsernameHistoryModule,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
