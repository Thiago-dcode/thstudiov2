import { OpenAILLMService } from './openAi-llm.service';
import { LLMConfig } from './types';

export class FactoryLLMService {
  public static create(config: LLMConfig) {
    switch (config.driver) {
      case 'openai':
        return new OpenAILLMService(config);
      default:
        throw new Error('LLM service not implemented');
    }
  }
}

