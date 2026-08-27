import {
  MediaSchema,
  MediaTranslationSchema,
} from "../schemas/media";
import { OffsetPaginationRequest } from "./request";
import { EnumType } from "../constants/enums";

// ==================== MEDIA TYPES ====================

// Media with timestamps
export type Media = MediaSchema;
// Media translation without id

export type MediaPortfolio = Pick<Media, 'id' | 'public_id' | 'title' | 'thumbnail' | 'url'| 'seo_alt' | 'seo_description' | 'seo_filename' | 'seo_title' | 'shape' | 'aspect_ratio' | 'is_highlight'> & {
  position: number
};
export type MediaTranslation = MediaTranslationSchema;

export type MediaUser = {
  id: number;
  username: string;
  name?: string | null;
  surname?: string | null;
};

export type MediaWithUser = Media & {
  user: MediaUser;
  /** LLM-assigned content tags, localized to the request language (media detail fetch only). */
  tags?: string[];
};

export type FullMedia = Media & {
  translations: MediaTranslation[]
}
export type MediaIndexRequest = OffsetPaginationRequest & {
  search?:string;
  user_id?: number;
  shape?: EnumType<'MEDIA_SHAPE'>;
  is_active?: boolean;
  blocked?: boolean;
  is_featured?: boolean;
  completed?: boolean;
  is_value_pillars?: boolean;
  is_highlight?: boolean;
  /** When false, join users and return `MediaWithUser[]`. Defaults to true (`Media[]`). */
  compact?: boolean;
}

/** Query params for listing a user's media (GET /users/:id/media; `user_id` is the path param). */
export type GetAllUserMediaQueryParams = Omit<MediaIndexRequest, 'user_id'>;

// Fields generated internally by the system (user cannot set these)
type InternalMediaFields = 'id' | 'public_id' | 'bytes' | 'url' | 'thumbnail' | 'thumbnail_bytes' | 'shape' | 'aspect_ratio' | 'extension' | 'blocked_at' | 'is_active' | 'is_featured' | 'is_value_pillars' | 'is_highlight' | 'status' | 'completed_at' | 'failed_reason' | 'seo_filename' | 'seo_generated_at' | 'created_at' | 'updated_at';

// What users can provide when creating media (public API input)
export type PublicCreateMediaInput = Omit<MediaSchema, InternalMediaFields>;
export type CreateMediaInputWithFile = PublicCreateMediaInput & {
  file?: File;
};

// What the internal service uses to create media (includes system-generated fields)
export type CreateMediaInput = Omit<
  MediaSchema,
  'id' | 'created_at' | 'updated_at' | 'status' | 'completed_at' | 'failed_reason'
> &
  Partial<Pick<MediaSchema, 'status' | 'completed_at' | 'failed_reason'>>;

// What users can update
export type UpdateMediaInput = Partial<Omit<MediaSchema, InternalMediaFields>>;

// What the internal service can update (public fields + system-only SEO filename/timestamp + storage keys)
export type UpdateMediaInternalInput = UpdateMediaInput &
  Partial<Pick<
    MediaSchema,
    | 'seo_filename'
    | 'seo_generated_at'
    | 'url'
    | 'thumbnail'
    | 'status'
    | 'completed_at'
    | 'failed_reason'
    | 'bytes'
    | 'thumbnail_bytes'
    | 'shape'
    | 'aspect_ratio'
  >>;

// ==================== MEDIA TRANSLATION TYPES ====================


// CreateMediaTranslationInput - required fields for creating translation
export type CreateMediaTranslationInput = Omit<MediaTranslationSchema, 'id'>;

export type UpdateMediaTranslationInput = Partial<Omit<MediaTranslationSchema, 'id' | 'media_id'>>;

export type MediaSeoFields = Pick<Media, 'seo_title' | 'seo_description' | 'seo_alt' | 'seo_filename'>

