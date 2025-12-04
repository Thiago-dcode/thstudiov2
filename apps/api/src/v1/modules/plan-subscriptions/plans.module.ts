import { Module } from '@nestjs/common';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';

@Module({
  providers: [PlanSubscriptionsRepository],
})
export class PlansModule {}
