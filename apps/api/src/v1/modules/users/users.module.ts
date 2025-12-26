import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { logConfig } from 'src/config/logging';
import {
  FactoryLogService,
  LogService,
} from '@repo/backend-lib/services/log-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { UserAuthDevicesModule } from '../user-auth-devices/user-auth-devices.module';
import { PlanSubscriptionsModule } from '../plan-subscriptions/plan-subscriptions.module';
import { PlansModule } from '../plans/plans.module';

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
  imports: [UserExtraDataModule, UserAuthDevicesModule, PlanSubscriptionsModule, PlansModule],
  exports: [UserService],
})
export class UserModule {}
