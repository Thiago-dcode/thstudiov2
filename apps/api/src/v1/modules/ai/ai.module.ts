import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { LLMService } from '@repo/backend-lib/services/llm-service/base';
import { FactoryLLMService } from '@repo/backend-lib/services/llm-service/factory';
import { openAiLLMConfig } from 'src/config/llm';
import { AI_QUEUE } from '@repo/common-lib/constants/queues';

@Module({
  imports: [BullModule.registerQueue({ name: AI_QUEUE })],
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
