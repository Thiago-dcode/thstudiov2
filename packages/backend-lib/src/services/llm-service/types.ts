export type LLMServiceDriverType = 'openai';

export type OpenAILLMConfig = {
  driver: 'openai';
  apiKey: string;
  model?: string;
  organization?: string;
};

export type LLMConfig = OpenAILLMConfig;

