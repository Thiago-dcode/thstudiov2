import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiProcessor } from './ai.processor';
import { AiTask } from './ai.task';
import { AiModule } from './ai.module';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { LlmTokensUsageRepository } from './llm-tokens-usage.repository';
import { MediaModerationRepository } from './media-moderation.repository';
import { UserAiCreditsEndedMail } from '../user-extra-data/mails/user-metrics-ended';
import { UserAccountBannedMail } from '../users/mails/user-account-banned.mail';
import { PlansModule } from '../plans/plans.module';
import { UserModule } from '../users/users.module';
import { PlanSubscriptionsModule } from '../plan-subscriptions/plan-subscriptions.module';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { PortfolioModule } from '../portfolios/portfolio.module';
import { CollectionModule } from '../collections/collection.module';
import { ServiceModule } from '../services/service.module';
import { AddressModule } from '../addresses/address.module';
import {
  AI_QUEUE,
  LOG_QUEUE,
  USER_METRICS_QUEUE,
} from '@repo/common-lib/constants/queues';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

@Module({
  imports: [
    BullModule.registerQueue({ name: AI_QUEUE }, { name: USER_METRICS_QUEUE }, { name: LOG_QUEUE }),
    UserExtraDataModule,
    PlansModule,
    UserModule,
    PlanSubscriptionsModule,
    EmailPreferencesModule,
    AiModule,
    PortfolioModule,
    CollectionModule,
    ServiceModule,
    AddressModule,
  ],
  providers: [
    AiProcessor,
    AiTask,
    LlmTokensUsageRepository,
    MediaModerationRepository,
    UserAiCreditsEndedMail,
    UserAccountBannedMail,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'ai',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
})
export class AiProcessorModule {}
