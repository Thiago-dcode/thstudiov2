import { MediaSeoFields } from "./media"

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