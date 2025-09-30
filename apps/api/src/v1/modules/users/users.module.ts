import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { PlansRepository } from '../plans/plans.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { UserPlanTransactionsRepository } from '../user-plan-transactions/user-plan-transactions.repository';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { logConfig } from 'src/config/logging';
import {
  FactoryLogService,
  LogService,
} from '@repo/backend-lib/services/log-service';
import { NotifyNewUserMail } from './mails/notify-new-user.mail';
import { UserAuthDevicesModule } from '../user-auth-devices/user-auth-devices.module';
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    PlansRepository,
    UserPlanTransactionsRepository,
    UserExtraDataRepository,
    NotifyNewUserMail,
    {
      provide: LogService,
      useFactory: () => {
        return FactoryLogService.createLogService('file', logConfig.users);
      },
    },
   
  ],
  imports: [UserExtraDataModule, UserAuthDevicesModule],
})
export class UserModule {}
