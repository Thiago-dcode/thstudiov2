import { Module } from '@nestjs/common';
import { PlanSubscriptionsService } from './plan-subscriptions.service';
import { PlanSubscriptionsController } from './plan-subscriptions.controller';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { PlanPricesModule } from '../plan-prices/plan-prices.module';
import { PlansModule } from '../plans/plans.module';
import { UserModule } from '../users/users.module';

@Module({
  imports: [PlanPricesModule, PlansModule,UserModule],
  controllers: [PlanSubscriptionsController],
  providers: [PlanSubscriptionsService, PlanSubscriptionsRepository],
  exports: [PlanSubscriptionsService],
})
export class PlanSubscriptionsModule {}
