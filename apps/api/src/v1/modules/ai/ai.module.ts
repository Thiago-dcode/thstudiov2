import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LLMService } from '@repo/backend-lib/services/llm-service/base';
import { FactoryLLMService } from '@repo/backend-lib/services/llm-service/factory';
import { openAiLLMConfig } from 'src/config/llm';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { LlmTokensUsageRepository } from './llm-tokens-usage.repository';
import { MediaModule } from '../media/media.module';
import { AddressModule } from '../addresses/address.module';

@Module({
  controllers: [AiController],
  imports: [UserExtraDataModule, MediaModule,AddressModule],
  providers: [
    AiService,
    LlmTokensUsageRepository,
    {
      provide: LLMService,
      useFactory: () => {
        return FactoryLLMService.create(openAiLLMConfig);
      },
    },
  ],
  exports: [AiService],
})
export class AiModule {}

