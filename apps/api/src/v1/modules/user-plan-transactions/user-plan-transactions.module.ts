import { Module } from '@nestjs/common';
import { UserPlanTransactionsService } from './user-plan-transactions.service';
import { UserPlanTransactionsController } from './user-plan-transactions.controller';
import { UserPlanTransactionsRepository } from './user-plan-transactions.repository';

@Module({
  controllers: [UserPlanTransactionsController],
  providers: [UserPlanTransactionsService, UserPlanTransactionsRepository],
})
export class UserPlanTransactionsModule {}
