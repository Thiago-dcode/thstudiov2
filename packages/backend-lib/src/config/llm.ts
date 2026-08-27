import { getConfigValue } from '@repo/common-lib/config/utils';
import { OpenAILLMConfig } from '../services/llm-service/types';

const LLM_CONFIG = getConfigValue('llm');

export const openAiLLMConfig: OpenAILLMConfig = {
  driver: 'openai',
  apiKey: LLM_CONFIG.apiKey,
  model: LLM_CONFIG.model || '',
  organization: LLM_CONFIG.organization,
};
