import {
  MediaSchema,
  MediaSchemaWithoutTimestamps,
  MediaTranslationSchema,
} from "../schemas/media";
import { OffsetPaginationRequest } from "./request";
import { EnumType } from "../constants/enums";

// ==================== MEDIA TYPES ====================

// Media with timestamps
export type Media = MediaSchema;
// Media translation without id
export type MediaTranslation = MediaTranslationSchema;

export type FullMedia = Media & {
    translations:MediaTranslation[]
}
export type MediaIndexRequest = OffsetPaginationRequest & {
    user_id?: number;
    shape?: EnumType<'MEDIA_SHAPE'>;
    is_active?: boolean;
    blocked?: boolean;
}

// Fields generated internally by the system (user cannot set these)
type InternalMediaFields = 'id' | 'public_id' | 'bytes' | 'url' | 'thumbnail' | 'thumbnail_bytes'|'shape'| 'extension' | 'blocked' | 'is_active' | 'created_at' | 'updated_at';

// What users can provide when creating media (public API input)
export type PublicCreateMediaInput = Omit<MediaSchema, InternalMediaFields>;
export type CreateMediaInputWithFile = PublicCreateMediaInput & {
  file?: File;
};

// What the internal service uses to create media (includes system-generated fields)
export type CreateMediaInput = Omit<MediaSchema, 'id' | 'created_at' | 'updated_at'>;

// What users can update
export type UpdateMediaInput = Partial<Omit<MediaSchema, InternalMediaFields>>;

// ==================== MEDIA TRANSLATION TYPES ====================


// CreateMediaTranslationInput - required fields for creating translation
export type CreateMediaTranslationInput = Omit<MediaTranslationSchema, 'id'>;

export type UpdateMediaTranslationInput = Partial<Omit<MediaTranslationSchema, 'id' | 'media_id'>>;

