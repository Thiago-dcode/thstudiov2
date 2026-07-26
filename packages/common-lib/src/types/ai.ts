import { EnumType, MODERATION_SEVERITY } from "../constants/enums"

export type GenerateMediaMetadataInput = {
    user_id: number;
    media_id: number;
}

/** Compact category shape sent to the LLM so it can pick matching category ids. */
export type MediaMetadataPromptCategory = {
    id: number;
    name: string;
    type: EnumType<'CATEGORY_TYPE'>;
}

export type LLMUsage = {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
};

/** One locale's SEO row for portfolio / collection / service / user `*_translations`. */
export type SeoTranslation = {
    language_code: EnumType<'LANGUAGE_CODE'>;
    seo_title: string | null;
    seo_description: string | null;
};

/** Media locale row adds a localized alt text (filename stays language-neutral / MAIN-only). */
export type MediaSeoTranslation = SeoTranslation & {
    seo_alt: string | null;
};

export type GenerateMediaMetadataResponse = {
    /** Language-neutral: one physical filename + category tags. */
    seo_filename: string | null;
    category_ids: number[];
    /** One row per supported locale (EN/ES/PT). */
    translations: MediaSeoTranslation[];
    usage?: LLMUsage;
}

/** SEO fields shared by portfolio / collection / service / user (no alt/filename). */
export type EntitySeoFields = {
    seo_title?: string | null;
    seo_description?: string | null;
};

export type GenerateEntityMetadataResponse = {
    /** One row per supported locale (EN/ES/PT). */
    translations: SeoTranslation[];
    usage?: LLMUsage;
};

/** Lean SEO payload returned by the per-entity `/metadata` endpoints for Next.js `generateMetadata`. */
export type EntitySeoMetadata = {
    seo_title: string | null;
    seo_description: string | null;
    og_image: string | null;
    /** Locale-agnostic path (no locale prefix); the web builds canonical + hreflang from it. */
    canonical_path: string;
    noindex: boolean;
};

/** Payload for cron-driven entity SEO generation (portfolio / collection / service / user). */
export type EntityMetadataEntity = 'portfolio' | 'collection' | 'service' | 'user';

/** Cron batch: find due rows for this entity type and enqueue single-entity jobs. */
export type GenerateEntityMetadataPayload = {
    entity: EntityMetadataEntity;
};

/** Generate SEO metadata for one concrete entity row. */
export type GenerateSingleEntityMetadataPayload = {
    entity: EntityMetadataEntity;
    id: number;
    user_id: number;
};

/** Integer 0–10 derived from MODERATION_SEVERITY enum values. */
export type ContentModerationSeverity = (typeof MODERATION_SEVERITY)[keyof typeof MODERATION_SEVERITY] | 2 | 4 | 6 | 8;

export type ContentModerationFields = {
    is_allowed: boolean;
    severity: ContentModerationSeverity;
    content_type: 'photograph' | 'painting' | 'illustration' | 'digital_art' | 'mixed_media' | 'unknown';
    reason: string;
};

export type ContentModerationResponse = {
    moderation: ContentModerationFields;
    usage?: LLMUsage;
}