import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhookProcessor } from './webhooks-processor.service';
import { PlanSubscriptionsModule } from '../plan-subscriptions/plan-subscriptions.module';
import { UserModule } from '../users/users.module';
import { PlanPricesModule } from '../plan-prices/plan-prices.module';
import { UserBenefitModule } from '../user-benefit/user-benefit.module';
import { PLAN_SUBSCRIPTIONS_QUEUE, STRIPE_WEBHOOKS_QUEUE, LOG_QUEUE } from '@repo/common-lib/constants/constants';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { Helpers } from 'src/common/services/helpers.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: STRIPE_WEBHOOKS_QUEUE },
      { name: PLAN_SUBSCRIPTIONS_QUEUE },
      { name: LOG_QUEUE },
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
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'webhook',
          callback: {
            channel: 'webhook/error',
            callback: Helpers.callback500ErrorMail,
          },
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
})
export class WebhooksModule {}
