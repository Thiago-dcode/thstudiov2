
// llmService.ts
export type LLMMessageRole = 'system' | 'user' | 'assistant';
export type LLMUsage = {
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

/**
 * Constrains the reply to a JSON Schema (OpenAI Structured Outputs, strict mode). In strict mode
 * every object must list ALL its properties in `required` and set `additionalProperties: false`;
 * an optional field is a union with `null`. Keep a schema stable across calls: the provider
 * caches the processed schema, and a new one costs extra latency on its first request.
 */
export interface LLMJsonSchemaFormat {
  /** a-z, A-Z, 0-9, `_` and `-`, at most 64 chars. */
  name: string;
  schema: Record<string, unknown>;
  description?: string;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  /** When set, `text` is JSON matching this schema — unless the model refused (see `refusal`). */
  responseFormat?: LLMJsonSchemaFormat;
}

export interface LLMCompletionResponse {
  text: string;
  /** The model declined the request. A refusal does not follow `responseFormat`; `text` is empty. */
  refusal?: string;
  /** The reply was cut short (e.g. the token limit), so `text` may be partial, invalid JSON. */
  incomplete?: boolean;
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
