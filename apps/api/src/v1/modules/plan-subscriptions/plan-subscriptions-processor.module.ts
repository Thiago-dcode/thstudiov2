import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PLAN_SUBSCRIPTIONS_QUEUE } from '@repo/common-lib/constants/constants';
import { PlanSubscriptionProcessor } from './plan-subscription.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: PLAN_SUBSCRIPTIONS_QUEUE }),
  ],
  providers: [PlanSubscriptionProcessor],
})
export class PlanSubscriptionsProcessorModule {}
