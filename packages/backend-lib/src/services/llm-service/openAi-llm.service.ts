import { LLMService, LLMCompletionRequest, LLMCompletionResponse, LLMMessage } from './llm.service';
import { OpenAILLMConfig } from './types';
import OpenAI from 'openai';
import type { ResponseInputItem, ResponseInputMessageContentList } from 'openai/resources/responses/responses';

const isReasoningModel = (model: string): boolean =>
  /^(gpt-5|gpt-6|o\d)/.test(model);

/**
 * Our provider-neutral message → a Responses API input message (`input_text` / `input_image`).
 * Assistant turns only accept output parts, so their text is flattened to a plain string, and an
 * image part without a URL is dropped rather than sent as `null` (a 400).
 */
const toInputItem = (msg: LLMMessage): ResponseInputItem => {
  if (typeof msg.content === 'string') return { type: 'message', role: msg.role, content: msg.content };
  if (msg.role === 'assistant') {
    return { type: 'message', role: msg.role, content: msg.content.map((part) => part.text ?? '').join('') };
  }
  return {
    type: 'message',
    role: msg.role,
    content: msg.content.flatMap((part): ResponseInputMessageContentList => {
      if (part.type !== 'image_url') return [{ type: 'input_text', text: part.text ?? '' }];
      return part.image_url?.url ? [{ type: 'input_image', image_url: part.image_url.url, detail: 'auto' }] : [];
    }),
  };
};

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

  /**
   * Responses API. With `responseFormat` the reply is constrained by Structured Outputs
   * (`text.format` json_schema, strict), so it always matches the schema — except a refusal,
   * which comes back as its own content part and is surfaced as `refusal` instead of `text`.
   */
  public async complete(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse> {
    const response = await this.client.responses.create({
      model: this.model,
      input: request.messages.map(toInputItem),
      max_output_tokens: request.maxTokens,
      // Reasoning models (gpt-5.x, gpt-6.x, o-series) reject `temperature`, and
      // their hidden reasoning tokens count against max_output_tokens, so
      // keep effort low for these extraction-style calls.
      ...(isReasoningModel(this.model)
        ? { reasoning: { effort: 'low' as const } }
        : { temperature: request.temperature }),
      ...(request.responseFormat && {
        text: {
          format: {
            type: 'json_schema' as const,
            name: request.responseFormat.name,
            description: request.responseFormat.description,
            schema: request.responseFormat.schema,
            strict: true,
          },
        },
      }),
      // These are one-shot calls; nothing reads the response back from OpenAI later.
      store: false,
    });

    if (response.error) {
      throw new Error(`OpenAI response failed: ${response.error.message}`);
    }

    const incompleteReason = response.status === 'incomplete' ? response.incomplete_details?.reason : undefined;
    if (incompleteReason === 'content_filter') {
      throw new Error('Response was filtered by content filter.');
    }
    if (incompleteReason) {
      // Truncated (e.g. max_output_tokens): the partial text is returned, but it may not parse.
      console.warn(`OpenAI response incomplete (${incompleteReason}). Partial content returned.`);
    }

    const refusal = response.output
      .flatMap((item) => (item.type === 'message' ? item.content : []))
      .find((part) => part.type === 'refusal')?.refusal;

    const text = response.output_text ?? '';
    if (!text && !refusal && !incompleteReason) {
      console.warn('OpenAI response - output:', JSON.stringify(response.output, null, 2));
      throw new Error('Response completed but content is missing.');
    }

    return {
      text,
      refusal,
      incomplete: !!incompleteReason,
      usage: response.usage
        ? {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }
}
