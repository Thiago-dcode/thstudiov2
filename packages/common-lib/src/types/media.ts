import {
  MediaSchema,
  MediaTranslationSchema,
} from "../schemas/media";
import { OffsetPaginationRequest } from "./request";
import { EnumType } from "../constants/enums";
import { MEDIA_ORDER_BY_COLUMNS } from "../constants/media";
import type { SqlOrderDirection } from "./database";
import type { LocationInput, LocationSummary } from "./location";

// ==================== MEDIA TYPES ====================

/** The place a media was made, as media responses carry it (a slice of the `locations` row). */
export type MediaLocation = Pick<LocationSummary, 'id' | 'formatted' | 'name'>;

// Media with timestamps
export type Media = MediaSchema & {
  /** Present when the row was read with its location joined; null when none is set. */
  location?: MediaLocation | null;
};
// Media translation without id

export type MediaPortfolio = Pick<Media, 'id' | 'public_id' | 'title' | 'thumbnail' | 'url' | 'seo_alt' | 'seo_description' | 'seo_filename' | 'seo_title' | 'shape' | 'aspect_ratio' | 'is_highlight' | 'media_type'> & {
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
  search?: string;
  user_id?: number;
  shape?: EnumType<'MEDIA_SHAPE'>;
  media_type?: EnumType<'MEDIA_TYPE'>;
  is_active?: boolean;
  blocked?: boolean;
  is_featured?: boolean;
  completed?: boolean;
  is_value_pillars?: boolean;
  is_highlight?: boolean;
  /** When false, join users and return `MediaWithUser[]`. Defaults to true (`Media[]`). */
  compact?: boolean;
  order_by?: MediaOrderBy;
  order?: SqlOrderDirection;
}

export type MediaOrderBy = (typeof MEDIA_ORDER_BY_COLUMNS)[number];

/** Query params for listing a user's media (GET /users/:id/media; `user_id` is the path param). */
export type GetAllUserMediaQueryParams = Omit<MediaIndexRequest, 'user_id'>;

// Fields generated internally by the system (user cannot set these)
type InternalMediaFields = 'id' | 'public_id' | 'bytes' | 'url' | 'thumbnail' | 'thumbnail_bytes' | 'previews' | 'previews_bytes' | 'video_preview' | 'video_preview_bytes' | 'shape' | 'aspect_ratio' | 'extension' | 'media_type' | 'blocked_at' | 'is_active' | 'is_featured' | 'is_value_pillars' | 'is_highlight' | 'status' | 'completed_at' | 'failed_reason' | 'seo_filename' | 'seo_generated_at' | 'location_id' | 'created_at' | 'updated_at';

/**
 * Users never send `location_id`: they send the place they picked, which the API resolves into
 * a `locations` row. `null` on update clears it.
 */
type MediaLocationPayload = { location?: LocationInput | null };

// What users can provide when creating media (public API input)
export type PublicCreateMediaInput = Omit<MediaSchema, InternalMediaFields> & MediaLocationPayload;
export type CreateMediaInputWithFile = PublicCreateMediaInput & {
  generate_metadata?: boolean;
  file?: File;
  /**
   * Set by `createMediaApi` once the file has been presigned and PUT directly to S3 — the
   * dialog itself never populates these. `upload_id` is the uuid `createUploadUrl` returned;
   * the API rebuilds the full temp key from it plus the authenticated user, so the browser
   * never has to (or gets to) express a storage path itself.
   */
  upload_id?: string;
  original_name?: string;
  content_type?: string;
};

/** Input to `POST /media/upload-url` — what is being uploaded, before any bytes move. */
export type CreateMediaUploadUrlInput = {
  user_id: number;
  filename: string;
  content_type: string;
  size: number;
};

/** Response from `POST /media/upload-url`. Only `upload_id` — never a path — travels back. */
export type CreateMediaUploadUrl = {
  upload_url: string;
  upload_id: string;
  expires_in: number;
};

// What the internal service uses to create media (includes system-generated fields)
export type CreateMediaInput = Omit<
  MediaSchema,
  'id' | 'created_at' | 'updated_at' | 'status' | 'completed_at' | 'failed_reason'
> &
  Partial<Pick<MediaSchema, 'status' | 'completed_at' | 'failed_reason'>>;

// What users can update
export type UpdateMediaInput = Partial<Omit<MediaSchema, InternalMediaFields>> & MediaLocationPayload;

/** Body of `PATCH /media/locations`: one picked place applied to many media. */
export type UpdateMediaLocationsInput = {
  location: LocationInput;
  media: number[];
};

// What the internal service can update (public fields + system-only SEO filename/timestamp + storage keys).
// Column-shaped: the picked place has already been resolved to `location_id`.
export type UpdateMediaInternalInput = Partial<Omit<MediaSchema, InternalMediaFields>> &
  Partial<Pick<
    MediaSchema,
    | 'location_id'
    | 'seo_filename'
    | 'seo_generated_at'
    | 'url'
    | 'thumbnail'
    | 'previews'
    | 'previews_bytes'
    | 'video_preview'
    | 'video_preview_bytes'
    | 'status'
    | 'completed_at'
    | 'failed_reason'
    | 'bytes'
    | 'thumbnail_bytes'
    | 'shape'
    | 'aspect_ratio'
    | 'extension'
  >>;

// ==================== MEDIA TRANSLATION TYPES ====================


// CreateMediaTranslationInput - required fields for creating translation
export type CreateMediaTranslationInput = Omit<MediaTranslationSchema, 'id'>;

export type UpdateMediaTranslationInput = Partial<Omit<MediaTranslationSchema, 'id' | 'media_id'>>;

/** Payload for the async media update worker (`JOB_UPDATE_MEDIA`). */
export type UpdateMediaJobInput = {
  media_id: number;
  user_id: number;
  data: UpdateMediaInput;
};

export type MediaSeoFields = Pick<Media, 'seo_title' | 'seo_description' | 'seo_alt' | 'seo_filename'>


export type MediaJobDto = {
  media: Media,
  generate_metadata?: boolean
}
