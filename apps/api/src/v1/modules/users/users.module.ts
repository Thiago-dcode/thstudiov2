import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { UserRepository } from './users.repository';
import { PlansRepository } from '../plans/plans.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { UserPlanTransactionsRepository } from '../user-plan-transactions/user-plan-transactions.repository';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { FactoryLogginService } from '@repo/backend-lib/services/logginService/factory';
import { LogginService } from '@repo/backend-lib/services/logginService/base';
import { logginConfig } from 'src/config/loggin';
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    PlansRepository,
    UserPlanTransactionsRepository,
    UserExtraDataRepository,
    {
      provide: LogginService,
      useFactory: () => {
        return FactoryLogginService.createLogginService(
          'file',
          logginConfig.users.config,
        );
      },
    },
  ],
  imports: [UserExtraDataModule],
})
export class UserModule {}
