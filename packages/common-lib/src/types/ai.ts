import { MediaSeoFields } from "./media"
import { MODERATION_SEVERITY } from "../constants/enums"

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