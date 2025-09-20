import { Module } from '@nestjs/common';
import { UserPlanTransactionsService } from './user-plan-transactions.service';
import { UserPlanTransactionsController } from './user-plan-transactions.controller';

@Module({
  controllers: [UserPlanTransactionsController],
  providers: [UserPlanTransactionsService],
})
export class UserPlanTransactionsModule {}
