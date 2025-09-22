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
import { MailService } from '@repo/backend-lib/services/mail-service';
import { mailingConfig, mailingDriver } from 'src/config/mailling';
import { FactoryMailService } from '@repo/backend-lib/services/mail-service/factory';
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    PlansRepository,
    UserPlanTransactionsRepository,
    UserExtraDataRepository,
    {
      provide: LogService,
      useFactory: () => {
        return FactoryLogService.createLogService('file', logConfig.users);
      },
    },
    {
      provide: MailService,
      useFactory: () => {
        return FactoryMailService.createMailService(
          mailingDriver,
          mailingConfig,
        );
      },
    },
  ],
  imports: [UserExtraDataModule],
})
export class UserModule {}
