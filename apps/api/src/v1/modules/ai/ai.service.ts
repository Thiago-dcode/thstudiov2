import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LLMService } from '@repo/backend-lib/services/llm-service/base';
import { LLM_TOKENS_USAGE_EVENT, MEDIA_MODERATION_EVENT } from '@repo/common-lib/constants/constants';
import { openAiLLMConfig } from 'src/config/llm';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { MediaSeoFields } from '@repo/common-lib/types/media';
import { ContentModerationFields } from '@repo/common-lib/types/ai';
import { MODERATION_SEVERITY } from '@repo/common-lib/constants/enums';
import { LlmTokensUsageEvent } from './events/llm-tokens-usage.event';
import { MediaModerationEvent } from './events/media-moderation.event';
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
    private readonly eventEmitter: EventEmitter2,
  ) { }

  /** Generate SEO JSON for a media image */
  public async getMediaSeo(mediaUrl: string, language: string, meta: { media_id: number; user_id: number }) {
    try {
      await this.llmService.setup();

      // Expected JSON structure with validation rules:
      // - seo_title: ≤60 chars, concise and descriptive
      // - seo_description: ≤160 chars, accurate image summary
      // - seo_alt: ≤125 chars, accessibility-focused
      // - seo_filename: ≤100 chars, lowercase, use hyphens instead of spaces, only letters, numbers, "-" and "_"
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
        - seo_filename: ≤100 chars, lowercase, use hyphens instead of spaces, only letters, numbers, "-" and "_"
        - All text content (seo_title, seo_description, seo_alt, seo_filename) must be written in ${language}
        Base all fields on the visual content only. Ignore filename and URL.`
        
              },
              {
                type: 'image_url' as const,
                image_url: { url: mediaUrl }
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
            media_id: meta.media_id,
            user_id: meta.user_id,
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
            user_id: meta.user_id,
            usage_type: 'GENERATE_MEDIA_SEO',
            matches_expected_response: matchesExpectedResponse,
          }),
        );
      }

      this.logger
        .name('get-media-seo')
        .info('Successfully generated media SEO for user ' + meta.user_id);

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
          `Failed to generate media SEO for media_id [${meta.media_id}] and user [${meta.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }

  /** Moderate media content to determine if it is allowed */
  public async moderateContent(mediaUrl: string, meta: { user_id: number }) {
    try {
      await this.llmService.setup();

      const EXPECTED_JSON: ContentModerationFields = {
        is_allowed: true,
        severity: MODERATION_SEVERITY.SAFE,
        content_type: 'unknown',
        reason: '',
      };

      const result = await this.llmService.complete({
        messages: [
          {
            role: 'system',
            content: 'You are a strict, zero-tolerance content moderation and child-safety system. Your priorities: (1) detect CSAM and any exploitation of minors, (2) detect and severely penalize explicit sexual and pornographic content. You always err on the side of caution — if content is borderline, assign a HIGHER severity. Output valid JSON only. No extra text.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text' as const,
                text: `Analyze the image and return valid JSON with exactly these fields:
        ${JSON.stringify(EXPECTED_JSON)}
        SEVERITY SCALE (0–10)
        0      – Safe. No issues.
        1 – 2  – Minimal. Mild suggestive content, artistic nudity (paintings, sculptures).
        3 – 4  – Low. Partial nudity (boudoir), mild violence in art/historical context.
        5 – 6  – Moderate. Explicit but legal adult content, graphic artistic violence.
        7 – 8  – High. Extreme explicit content, glorified realistic violence, hate promotion.
        9      – Severe. Exploitation, abuse depiction, extreme illegal content.
        10     – Critical. CSAM detected — child sexual abuse material.
        ═══════════════════════════════════════════
        content_type (one of)
        ═══════════════════════════════════════════
        "photograph" | "painting" | "illustration" | "digital_art" | "mixed_media" | "unknown"
        ═══════════════════════════════════════════
        DECISION RULES
        ═══════════════════════════════════════════
        - is_allowed = true ONLY when severity ≤ 6
        - is_allowed = false when severity ≥ 7
        - When in doubt about minors, ALWAYS escalate (higher severity)
        - When in doubt about sexual/pornographic content, ALWAYS assign severity ≥ 7
        - Explicit sexual activity with adults; nudity is visible always severity ≥ 7
        - When in doubt about other content, assign a higher severity
        - reason: ≤120 chars, neutral explanation in English user friendly

        Base the decision ONLY on visible image content.
        Ignore filename, metadata, and URL.
        Return valid JSON only.`
              },
              {
                type: 'image_url' as const,
                image_url: { url: mediaUrl }
              }
            ]
          }
        ],
        temperature: 0.1
      });

      // Parse JSON response, handling markdown code blocks if present
      let moderationData: Partial<ContentModerationFields> = {};
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

        // Clamp severity to integer 0–10
        const rawSeverity = typeof parsed.severity === 'number'
          ? Math.min(MODERATION_SEVERITY.CRITICAL, Math.max(MODERATION_SEVERITY.SAFE, Math.round(parsed.severity)))
          : MODERATION_SEVERITY.SAFE;

        // Map and validate the fields
        moderationData = {
          is_allowed: parsed?.is_allowed,
          severity: rawSeverity as ContentModerationFields['severity'],
          content_type: parsed.content_type || 'unknown',
          reason: parsed.reason || '',
        };

        // Check if response matches expected format
        matchesExpectedResponse = typeof parsed.is_allowed === 'boolean'
          && typeof parsed.severity === 'number'
      } catch (err) {
        this.logger
          .name('moderate-content')
          .warn('AI returned invalid JSON', {
            user_id: meta.user_id,
            response_text: result.text,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        // Default to allowed if parsing fails
        moderationData = { ...EXPECTED_JSON };
      }

      // Emit event to track LLM tokens usage
      if (result.usage?.totalTokens) {
        this.eventEmitter.emit(
          LLM_TOKENS_USAGE_EVENT,
          new LlmTokensUsageEvent({
            tokens: result.usage.totalTokens,
            model: openAiLLMConfig.model,
            user_id: meta.user_id,
            usage_type: 'MODERATE_MEDIA_CONTENT',
            matches_expected_response: matchesExpectedResponse,
          }),
        );
      }

      this.logger
        .name('moderate-content')
        .info('Successfully moderated content', {
          user_id: meta.user_id,
          is_allowed: moderationData.is_allowed,
          severity: moderationData.severity,
          content_type: moderationData.content_type,
          matches_expected_response: matchesExpectedResponse,
          tokens_used: result.usage?.totalTokens,
        });

      // Emit event to record moderation result
      this.eventEmitter.emit(
        MEDIA_MODERATION_EVENT,
        new MediaModerationEvent({
          is_allowed: moderationData.is_allowed ?? true,
          severity: moderationData.severity ?? MODERATION_SEVERITY.SAFE,
          content_type: moderationData.content_type ?? 'unknown',
          reason: moderationData.reason ?? null,
          user_id: meta.user_id,
        }),
      );

      return {
        moderation: moderationData as ContentModerationFields,
        usage: result.usage,
      };
    } catch (error) {
      this.logger
        .channel('ai/error')
        .name('moderate-content')
        .error(
          `Failed to moderate content for user [${meta.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      throw error;
    }
  }

}
