import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  PLAN_SUBSCRIPTIONS_QUEUE,
  LOG_QUEUE,
} from '@repo/common-lib/constants/queues';
import { PlanSubscriptionProcessor } from './plan-subscription.processor';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { PlansModule } from '../plans/plans.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { Helpers } from 'src/common/services/helpers.service';
import { SubscriptionChangedMail } from './mails/subscription-changed.mail';

@Module({
  imports: [
    BullModule.registerQueue({ name: PLAN_SUBSCRIPTIONS_QUEUE }, { name: LOG_QUEUE }),
    UserExtraDataModule,
    PlansModule,
    EmailPreferencesModule,
  ],
  providers: [
    PlanSubscriptionProcessor,
    SubscriptionChangedMail,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'subscriptions',
          callback: {
            channel: 'subscriptions/error',
            callback: Helpers.callback500ErrorMail,
          },
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
})
export class PlanSubscriptionsProcessorModule {}
