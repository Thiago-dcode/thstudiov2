import type { LLMJsonSchemaFormat } from '@repo/backend-lib/services/llm-service/base';
import type { ContentModerationFields } from '@repo/common-lib/types/ai';
import type { EnumType } from '@repo/common-lib/constants/enums';
import { MODERATION_SEVERITY } from '@repo/common-lib/constants/enums';

/**
 * Structured Outputs schemas (strict) for the AiService replies. Strict mode requires every
 * property in `required` and `additionalProperties: false` on every object. Each schema is built
 * once and never varies per call, so OpenAI's processed-schema cache and the prompt-cache prefix
 * stay warm. Length limits are NOT expressed here (`maxLength` is not a supported keyword): the
 * prompt asks for them and `sanitizeSeoText` enforces them.
 */

const object = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const text = (description: string) => ({ type: 'string', description });

/** `{ EN: {...}, ES: {...}, PT: {...} }` — one object per locale, keyed like `SEO_LOCALES`. */
const translationsSchema = (
  locales: readonly EnumType<'LANGUAGE_CODE'>[],
  fields: Record<string, unknown>,
) =>
  object(Object.fromEntries(locales.map((lc) => [lc, { ...object(fields), description: `Written in ${lc}.` }])));

const SEO_TITLE = text('SEO title, plain text.');
const SEO_DESCRIPTION = text('One or two complete sentences, plain text.');

export const mediaMetadataFormat = (locales: readonly EnumType<'LANGUAGE_CODE'>[]): LLMJsonSchemaFormat => ({
  name: 'media_metadata',
  schema: object({
    seo_filename: {
      type: 'string',
      description: 'Lowercase, hyphen-separated, language-neutral file name without extension.',
      pattern: '^[a-z0-9_-]+$',
    },
    category_ids: {
      type: 'array',
      description: 'Ids from the CATEGORIES list only.',
      items: { type: 'integer' },
    },
    translations: translationsSchema(locales, {
      seo_title: SEO_TITLE,
      seo_description: SEO_DESCRIPTION,
      seo_alt: text('Literal accessibility description of the visible content.'),
    }),
  }),
});

export const entityMetadataFormat = (locales: readonly EnumType<'LANGUAGE_CODE'>[]): LLMJsonSchemaFormat => ({
  name: 'entity_metadata',
  schema: object({
    translations: translationsSchema(locales, {
      seo_title: SEO_TITLE,
      seo_description: SEO_DESCRIPTION,
    }),
  }),
});

const CONTENT_TYPES: ContentModerationFields['content_type'][] = [
  'photograph', 'painting', 'illustration', 'digital_art', 'mixed_media', 'unknown',
];

export const contentModerationFormat: LLMJsonSchemaFormat = {
  name: 'content_moderation',
  schema: object({
    is_allowed: { type: 'boolean' },
    severity: {
      type: 'integer',
      minimum: MODERATION_SEVERITY.SAFE,
      maximum: MODERATION_SEVERITY.CRITICAL,
    },
    content_type: { type: 'string', enum: CONTENT_TYPES },
    reason: text('Empty when severity is 6 or lower.'),
  }),
};
