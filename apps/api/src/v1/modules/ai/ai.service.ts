import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService } from '@repo/backend-lib/services/llm-service/base';
import { LlmTokensUsageRepository } from './llm-tokens-usage.repository';
import { LlmTokensUsageEvent } from './events/llm-tokens-usage.event';
import { LLM_TOKENS_USAGE_EVENT, UPDATE_USER_EXTRA_DATA_METRICS } from '@repo/common-lib/constants/constants';
import { openAiLLMConfig } from 'src/config/llm';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { GetMediaSeoRequest } from './requests/get-media-seo.request';
import { UpdateUserExtraDataMetricsEvent } from '../user-extra-data/events/update-user-extra-data-metrics.event';
import { MediaService } from '../media/media.service';
import { MediaSeoFields } from '@repo/common-lib/types/media';
import { Helpers } from 'src/common/services/helpers.service';

@Injectable()
export class AiService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'ai',
    name: 'ai',
    callback: {
      channel: 'ai/error',
      callback: Helpers.callback500ErrorMail,
    },
  });

  constructor(
    private readonly llmService: LLMService,
    private readonly llmTokensUsageRepository: LlmTokensUsageRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly mediaService: MediaService,
  ) {
    // Helpers available for future use (caching, etc.)
  }

  /** Generate SEO JSON for a media image */
  public async getMediaSeo(request: GetMediaSeoRequest) {
    try {
      await this.llmService.setup();
      const imageUrl = await this.mediaService.getAsset(request.media_id);

      // Expected JSON structure with validation rules:
      // - seo_title: ≤60 chars, concise and descriptive
      // - seo_description: ≤160 chars, accurate image summary
      // - seo_alt: ≤125 chars, accessibility-focused
      // - seo_filename: ≤150 chars, lowercase, use hyphens instead of spaces, only letters, numbers, "-" and "_"
      const EXPECTED_JSON: MediaSeoFields = { "seo_title": "", "seo_description": "", "seo_alt": "", "seo_filename": "" }
      const result = await this.llmService.complete({
        messages: [
          {
            role: 'system',
            content: 'Generate SEO metadata for images. Output valid JSON only. No extra text.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text' as const,
                text: `Analyze the image and return valid JSON with exactly these fields:
        ${JSON.stringify(EXPECTED_JSON)}
        
        Rules:
        - seo_title: ≤60 chars, concise and descriptive
        - seo_description: ≤160 chars, accurate image summary
        - seo_alt: ≤125 chars, accessibility-focused
        - seo_filename: ≤150 chars, lowercase, use hyphens instead of spaces, only letters, numbers, "-" and "_"
        Base all fields on the visual content only. Ignore filename and URL.`
              },
              {
                type: 'image_url' as const,
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        temperature: 0.3
      });

      // Parse JSON response, handling markdown code blocks if present
      let seoData: {
        seo_title?: string | null;
        seo_description?: string | null;
        seo_alt?: string | null;
        seo_filename?: string | null;
      } = {};
      let matchesExpectedResponse = false;

      try {
        // Extract JSON from markdown code blocks if present
        let jsonText = result.text.trim();

        // Remove markdown code block syntax if present
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        // Parse the JSON
        const parsed = JSON.parse(jsonText);

        // Map and validate the fields
        seoData = {
          seo_title: parsed.seo_title || parsed.title || null,
          seo_description: parsed.seo_description || parsed.description || null,
          seo_alt: parsed.seo_alt || parsed.alt || null,
          seo_filename: parsed.seo_filename || parsed.filename || null,
        };

        // Check if response matches expected format (has at least one of the required fields)
        matchesExpectedResponse = !!(seoData.seo_title || seoData.seo_description || seoData.seo_alt || seoData.seo_filename);
      } catch (err) {
        this.logger
          .name('get-media-seo')
          .warn('AI returned invalid JSON', {
            media_id: request.media_id,
            user_id: request.user_id,
            response_text: result.text,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        // Return empty object if parsing fails, matchesExpectedResponse remains false
      }

      // Emit event to track LLM tokens usage
      if (result.usage?.totalTokens) {
        this.eventEmitter.emit(
          LLM_TOKENS_USAGE_EVENT,
          new LlmTokensUsageEvent({
            tokens: result.usage.totalTokens,
            model: openAiLLMConfig.model,
            user_id: request.user_id,
            usage_type: 'GENERATE_MEDIA_SEO',
            matches_expected_response: matchesExpectedResponse,
          }),
        );
      }

      this.logger
        .name('get-media-seo')
        .info('Successfully generated media SEO', {
          media_id: request.media_id,
          user_id: request.user_id,
          matches_expected_response: matchesExpectedResponse,
          tokens_used: result.usage?.totalTokens,
          seo_fields_generated: {
            has_title: !!seoData.seo_title,
            has_description: !!seoData.seo_description,
            has_alt: !!seoData.seo_alt,
            has_filename: !!seoData.seo_filename,
          },
        });

      return {
        seo: {
          seo_title: seoData.seo_title,
          seo_description: seoData.seo_description,
          seo_alt: seoData.seo_alt,
          seo_filename: seoData.seo_filename,
        },
        usage: result.usage
      };
    } catch (error) {
      this.logger
        .channel('ai/error')
        .name('get-media-seo')
        .error(
          `Failed to generate media SEO for media_id [${request.media_id}] and user [${request.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }

  @OnEvent(LLM_TOKENS_USAGE_EVENT)
  async handleLlmTokensUsageEvent(event: LlmTokensUsageEvent) {
    try {
      console.log(LLM_TOKENS_USAGE_EVENT, event);

      if (!event?.usage) {
        this.logger
          .name('llm-tokens-usage')
          .warn(`${LLM_TOKENS_USAGE_EVENT} - Event received without usage data`, event);
        return;
      }

      const usage = await this.llmTokensUsageRepository.create(event.usage);
      this.logger
        .name('llm-tokens-usage')
        .info(
          `${LLM_TOKENS_USAGE_EVENT} - Usage recorded for user [${event.usage.user_id}]`,
          usage,
        );

      this.eventEmitter.emit(
        UPDATE_USER_EXTRA_DATA_METRICS,
        new UpdateUserExtraDataMetricsEvent(event.usage.user_id)
      );
    } catch (error) {
      this.logger
        .name('llm-tokens-usage')
        .error(
          `${LLM_TOKENS_USAGE_EVENT} - Failed to record usage for user [${event?.usage?.user_id || 'unknown'}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }
}
