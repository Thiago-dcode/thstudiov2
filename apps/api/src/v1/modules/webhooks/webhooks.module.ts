import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhookProcessor } from './webhooks-processor.service';
import { PlanSubscriptionsModule } from '../plan-subscriptions/plan-subscriptions.module';
import { UserModule } from '../users/users.module';
import { PlanPricesModule } from '../plan-prices/plan-prices.module';
import { UserBenefitModule } from '../user-benefit/user-benefit.module';
import { PLAN_SUBSCRIPTIONS_QUEUE, STRIPE_WEBHOOKS_QUEUE } from '@repo/common-lib/constants/queues';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: STRIPE_WEBHOOKS_QUEUE },
      { name: PLAN_SUBSCRIPTIONS_QUEUE },
    ),
    PlanSubscriptionsModule,
    UserModule,
    PlanPricesModule,
    UserBenefitModule,
  ],
  controllers: [WebhooksController],
  providers: [
    WebhookProcessor,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'webhooks',
          name: 'stripe-webhook',
        });
      },
    },
  ],
})
export class WebhooksModule {}
