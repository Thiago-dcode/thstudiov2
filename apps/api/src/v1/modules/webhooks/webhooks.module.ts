import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhookProcessor } from './webhooks-processor.service';
import { PlanSubscriptionsModule } from '../plan-subscriptions/plan-subscriptions.module';
import { UserModule } from '../users/users.module';
import { PlanPricesModule } from '../plan-prices/plan-prices.module';
import { UserBenefitModule } from '../user-benefit/user-benefit.module';
import { STRIPE_WEBHOOKS_QUEUE } from '@repo/common-lib/constants/constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: STRIPE_WEBHOOKS_QUEUE }),
    PlanSubscriptionsModule,
    UserModule,
    PlanPricesModule,
    UserBenefitModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhookProcessor],
})
export class WebhooksModule {}
