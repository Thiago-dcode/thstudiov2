// llmService.ts
export type LLMMessageRole = 'system' | 'user' | 'assistant';
export type LLMUsage ={
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};
export type LLMMessageContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}>;

export interface LLMMessage {
  role: LLMMessageRole;
  content: LLMMessageContent;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface LLMCompletionResponse {
  text: string;
  usage?: LLMUsage
}

export abstract class LLMService {
  /** Optional setup: load API keys, initialize clients, etc. */
  public abstract setup(): Promise<void>;

  /** Main completion method: returns AI output + optional usage info */
  public abstract complete(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse>;
}
