import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PLAN_SUBSCRIPTIONS_QUEUE } from '@repo/common-lib/constants/constants';
import { PlanSubscriptionProcessor } from './plan-subscription.processor';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: PLAN_SUBSCRIPTIONS_QUEUE }),
    UserExtraDataModule,
    PlansModule
  ],
  providers: [PlanSubscriptionProcessor],
})
export class PlanSubscriptionsProcessorModule {}
