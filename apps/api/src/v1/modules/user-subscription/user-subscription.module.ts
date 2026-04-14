import { Module } from '@nestjs/common';
import { UserSubscriptionService } from './user-subscription.service';
import { UserSubscriptionController } from './user-subscription.controller';
import { PlanSubscriptionsRepository } from '../plan-subscriptions/plan-subscriptions.repository';

@Module({
  controllers: [UserSubscriptionController],
  providers: [UserSubscriptionService, PlanSubscriptionsRepository],
})
export class UserSubscriptionModule {}
