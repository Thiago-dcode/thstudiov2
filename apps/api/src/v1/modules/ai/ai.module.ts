import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { AiProcessor } from './ai.processor';
import { LLMService } from '@repo/backend-lib/services/llm-service/base';
import { FactoryLLMService } from '@repo/backend-lib/services/llm-service/factory';
import { openAiLLMConfig } from 'src/config/llm';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { LlmTokensUsageRepository } from './llm-tokens-usage.repository';
import { MediaModerationRepository } from './media-moderation.repository';
import { UserAiCreditsEndedMail } from '../user-extra-data/mails/user-metrics-ended';
import { UserAccountBannedMail } from '../users/mails/user-account-banned.mail';
import { AddressModule } from '../addresses/address.module';
import { PlansModule } from '../plans/plans.module';
import { UserModule } from '../users/users.module';
import { PlanSubscriptionsModule } from '../plan-subscriptions/plan-subscriptions.module';
import { AI_QUEUE } from '@repo/common-lib/constants/constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: AI_QUEUE }),
    UserExtraDataModule,
    PlansModule,
    UserModule,
    PlanSubscriptionsModule,
    AddressModule,
  ],
  providers: [
    AiService,
    AiProcessor,
    LlmTokensUsageRepository,
    MediaModerationRepository,
    UserAiCreditsEndedMail,
    UserAccountBannedMail,
    {
      provide: LLMService,
      useFactory: () => {
        return FactoryLLMService.create(openAiLLMConfig);
      },
    },
  ],
  exports: [AiService],
})
export class AiModule { }

