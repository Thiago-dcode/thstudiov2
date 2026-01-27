import { LLMService, LLMCompletionRequest, LLMCompletionResponse } from './llm.service';
import { OpenAILLMConfig } from './types';
import OpenAI from 'openai';

export class OpenAILLMService extends LLMService {
  private client: OpenAI;
  private model: string;

  constructor(protected readonly config: OpenAILLMConfig) {
    super();
    this.model = config.model || 'gpt-3.5-turbo';
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });
  }

  public async setup(): Promise<void> {
    // OpenAI client is initialized in constructor
    // Additional setup can be added here if needed
    return Promise.resolve();
  }

  public async complete(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })) as any,
      max_completion_tokens: request.maxTokens,
      temperature:this.model ==='gpt-5-nano'?undefined: request.temperature,
    });

    const choice = completion.choices[0];
    if (!choice || !choice.message) {
      throw new Error('No completion response from OpenAI');
    }

    // Handle cases where content might be null or in a different format
    let text = choice.message.content || '';
    
    // Log warnings for non-normal finish reasons
    if (choice.finish_reason === 'length') {
      // Response was truncated, but we still return the partial content
      console.warn('Response was truncated due to max_completion_tokens limit. Partial content returned.');
    } else if (choice.finish_reason === 'content_filter') {
      throw new Error('Response was filtered by content filter.');
    } else if (!text) {
      // Log the full choice for debugging if content is missing
      console.warn('OpenAI response - choice:', JSON.stringify(choice, null, 2));
      console.warn('OpenAI finish_reason:', choice.finish_reason);
      if (choice.finish_reason === 'stop') {
        throw new Error('Response completed but content is missing.');
      }
    }

    return {
      text: text,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }
}

