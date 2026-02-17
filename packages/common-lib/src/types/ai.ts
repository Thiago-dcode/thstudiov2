import { MediaSeoFields } from "./media"
import { MODERATION_SEVERITY, MODERATION_ACTION } from "../constants/enums"

export type GetMediaSeoInput = {
    user_id: number;
    media_id: number;
}

export type LLMUsage = {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
};

export type GetMediaSeoResponse = {
    seo: MediaSeoFields;
    usage?: LLMUsage;
}

export type ContentModerationCategories = {
    sexual_content: boolean;
    nudity: boolean;
    minor: boolean;
    csam: boolean;
    violence: boolean;
    graphic_violence: boolean;
    hate_symbols: boolean;
    self_harm: boolean;
    illegal_activity: boolean;
};

/** Integer 0–10 derived from MODERATION_SEVERITY enum values. */
export type ContentModerationSeverity = (typeof MODERATION_SEVERITY)[keyof typeof MODERATION_SEVERITY] | 2 | 4 | 6 | 8;

/** Derived from MODERATION_ACTION enum values. */
export type ContentModerationAction = (typeof MODERATION_ACTION)[keyof typeof MODERATION_ACTION];

export type ContentModerationFields = {
    is_allowed: boolean;
    severity: ContentModerationSeverity;
    content_type: 'photograph' | 'painting' | 'illustration' | 'digital_art' | 'mixed_media' | 'unknown';
    categories: ContentModerationCategories;
    action: ContentModerationAction;
    reason: string;
};

export type ContentModerationResponse = {
    moderation: ContentModerationFields;
    usage?: LLMUsage;
}