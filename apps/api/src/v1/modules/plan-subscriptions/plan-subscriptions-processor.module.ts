import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PLAN_SUBSCRIPTIONS_QUEUE } from '@repo/common-lib/constants/queues';
import { PlanSubscriptionProcessor } from './plan-subscription.processor';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { PlansModule } from '../plans/plans.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { LogService } from '@repo/backend-lib/services/log-service';
import { SubscriptionChangedMail } from './mails/subscription-changed.mail';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    BullModule.registerQueue({ name: PLAN_SUBSCRIPTIONS_QUEUE }),
    UserExtraDataModule,
    PlansModule,
    EmailPreferencesModule,
  ],
  providers: [
    PlanSubscriptionProcessor,
    SubscriptionChangedMail,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'plan-subscriptions',
          name: 'on-subscription-changes',
        });
      },
    },
  ],
})
export class PlanSubscriptionsProcessorModule {}
