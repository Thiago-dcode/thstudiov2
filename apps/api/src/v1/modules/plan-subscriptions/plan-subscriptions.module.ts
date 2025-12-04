import { Module } from '@nestjs/common';
import { PlanSubscriptionsService } from './plan-subscriptions.service';
import { PlanSubscriptionsController } from './plan-subscriptions.controller';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { TransactionsModule } from '../transactions/transactions.module';
import { PlanPricesModule } from '../plan-prices/plan-prices.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [TransactionsModule, PlanPricesModule, PlansModule],
  controllers: [PlanSubscriptionsController],
  providers: [PlanSubscriptionsService, PlanSubscriptionsRepository],
  exports: [PlanSubscriptionsService],
})
export class PlanSubscriptionsModule {}
