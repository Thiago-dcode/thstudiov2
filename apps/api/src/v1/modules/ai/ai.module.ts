import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { LLMService } from '@repo/backend-lib/services/llm-service/base';
import { FactoryLLMService } from '@repo/backend-lib/services/llm-service/factory';
import { openAiLLMConfig } from '@repo/backend-lib/config/llm';

@Module({
  providers: [
    AiService,
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
