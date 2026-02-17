import { MediaModerationSchema } from "../schemas/media-moderation";
import { OffsetPaginationRequest } from "./request";

// MediaModeration with timestamps
export type MediaModeration = MediaModerationSchema;

export type CreateMediaModerationInput = Omit<MediaModerationSchema, 'id' | 'created_at' | 'updated_at'>;

export type UpdateMediaModerationInput = Partial<CreateMediaModerationInput>;

export type MediaModerationIndexRequest = OffsetPaginationRequest & {
    user_id?: number;
    is_allowed?: boolean;
    created_at_from?: Date;
    created_at_to?: Date;
};

