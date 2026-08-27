import { Module } from '@nestjs/common';
import { LLMService } from '@repo/backend-lib/services/llm-service/base';
import { FactoryLLMService } from '@repo/backend-lib/services/llm-service/factory';
import { openAiLLMConfig } from '@repo/backend-lib/config/llm';
import { AiService } from '@repo/backend-lib/services/ai-service';

@Module({
  providers: [
    {
      provide: LLMService,
      useFactory: () => {
        return FactoryLLMService.create(openAiLLMConfig);
      },
    },
    {
      provide: AiService,
      useFactory: (llmService: LLMService) => {
        return AiService.instance(llmService);
      },
      inject: [LLMService],
    },
  ],
  exports: [AiService],
})
export class AiModule { }
