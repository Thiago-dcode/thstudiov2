import {
  MediaSchema,
  MediaSchemaWithoutTimestamps,
  MediaTranslationSchema,
} from "../schemas/media";
import { OffsetPaginationRequest } from "./request";
import { EnumType } from "../constants/enums";

// ==================== MEDIA TYPES ====================

// Media without timestamps
export type Media = MediaSchemaWithoutTimestamps;
// Media translation without id
export type MediaTranslation = MediaTranslationSchema;

export type FullMedia = Media & {
    translations:MediaTranslation[]
}
export type MediaIndexRequest = OffsetPaginationRequest & {
    user_id?: number;
    shape?: EnumType<'MEDIA_SHAPE'>;
    type?: EnumType<'MEDIA_TYPE'>;
    is_active?: boolean;
    blocked?: boolean;
    list_type: EnumType<'FORMAT_TYPE'>;
}

// CreateMediaInput - required fields for creating media
export type CreateMediaInput = Omit<
  MediaSchema,
  'id' | 'created_at' | 'updated_at' | 'title' | 'description' | 'thumbnail' | 'blocked' | 'shape' | 'is_active' | 'tags'
>;

export type UpdateMediaInput = Partial<Omit<MediaSchema, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;

// ==================== MEDIA TRANSLATION TYPES ====================


// CreateMediaTranslationInput - required fields for creating translation
export type CreateMediaTranslationInput = Omit<MediaTranslationSchema, 'id'>;

export type UpdateMediaTranslationInput = Partial<Omit<MediaTranslationSchema, 'id' | 'media_id'>>;

