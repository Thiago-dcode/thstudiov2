import {
  MediaSchema,
  MediaTranslationSchema,
} from "../schemas/media";
import { OffsetPaginationRequest } from "./request";
import { EnumType } from "../constants/enums";
import { MEDIA_ORDER_BY_COLUMNS } from "../constants/media";
import type { SqlOrderDirection } from "./database";
import type { LocationInput, LocationSummary } from "./location";
import type { CategoryBase } from "./category";

// ==================== MEDIA TYPES ====================

/** The place a media was made, as media responses carry it (a slice of the `locations` row). */
export type MediaLocation = Pick<LocationSummary, 'id' | 'formatted' | 'name'>;

// Media with timestamps
export type Media = MediaSchema & {
  /** Present when the row was read with its location joined; null when none is set. */
  location?: MediaLocation | null;
  /**
   * The disciplines / art styles on this media (never its AI tags), in the request language.
   * Only on the owner's atelier list, where the editor needs them.
   */
  categories?: CategoryBase[];
  /** How many of the owner's collections hold this media. Only on the owner's atelier list. */
  collections_count?: number;
  /**
   * How many distinct portfolios show this media — placed directly or through one of the
   * portfolio's collections, since both render it. Only on the owner's atelier list.
   */
  portfolios_count?: number;
};
// Media translation without id

export type MediaPortfolio = Pick<Media, 'id' | 'public_id' | 'title' | 'thumbnail' | 'video_preview' | 'url' | 'seo_alt' | 'seo_description' | 'seo_filename' | 'seo_title' | 'shape' | 'aspect_ratio' | 'is_highlight' | 'media_type'> & {
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
  /**
   * Internal: adds `collections_count` / `portfolios_count`. Set by the owner-only route, never
   * accepted from a client (the request DTO doesn't declare it, so the whitelist pipe drops it).
   */
  with_usage_counts?: boolean;
  /** Internal, owner-only like `with_usage_counts`: adds `categories` to each row. */
  with_categories?: boolean;
}

export type MediaOrderBy = (typeof MEDIA_ORDER_BY_COLUMNS)[number];

/** Query params for listing a user's media (GET /users/:id/media; `user_id` is the path param). */
export type GetAllUserMediaQueryParams = Omit<MediaIndexRequest, 'user_id'>;

// Fields generated internally by the system (user cannot set these)
type InternalMediaFields = 'id' | 'public_id' | 'bytes' | 'url' | 'thumbnail' | 'thumbnail_bytes' | 'previews' | 'previews_bytes' | 'video_preview' | 'video_preview_bytes' | 'duration_seconds' | 'shape' | 'aspect_ratio' | 'extension' | 'media_type' | 'blocked_at' | 'is_active' | 'is_featured' | 'is_value_pillars' | 'is_highlight' | 'status' | 'completed_at' | 'failed_reason' | 'seo_filename' | 'seo_generated_at' | 'location_id' | 'created_at' | 'updated_at';

/**
 * Users never send `location_id`: they send the place they picked, which the API resolves into
 * a `locations` row. `null` on update clears it.
 */
type MediaLocationPayload = { location?: LocationInput | null };

/**
 * The disciplines / art styles the artist picked, as ids. On update an empty array clears them and
 * absent leaves them alone. When a media has none, the AI metadata job picks them itself.
 */
type MediaCategoriesPayload = { category_ids?: number[] };

// What users can provide when creating media (public API input)
export type PublicCreateMediaInput = Omit<MediaSchema, InternalMediaFields> & MediaLocationPayload;
export type CreateMediaInputWithFile = PublicCreateMediaInput & {
  generate_metadata?: boolean;
  /**
   * Client-only: the picked categories as objects, so chips can render their names. `createMediaApi`
   * (and `updateMediaApi`'s caller) turn them into the wire's `category_ids`; this key never leaves
   * the browser. Absent = nothing picked (create) / unchanged (edit); `[]` on an edit clears.
   */
  categories?: CategoryBase[];
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
/** `is_active` is the owner's own visibility switch; `blocked_at` stays with moderation. */
export type UpdateMediaInput = Partial<Omit<MediaSchema, InternalMediaFields>> &
  Partial<Pick<MediaSchema, 'is_active'>> &
  MediaLocationPayload &
  MediaCategoriesPayload;

/** Body of `PATCH /media/locations`: one picked place applied to many media. */
export type UpdateMediaLocationsInput = {
  location: LocationInput;
  media: number[];
};

/** Body of `POST /media/delete-many`: the media the artist picked. */
export type DeleteManyMediaInput = {
  media: number[];
};

/** One media the batch delete did not remove, and why. */
export type DeleteManyMediaError = {
  media_id: number;
  message: string;
};

/** `POST /media/delete-many` — the ids that were deleted, and the ones that were not. */
export type DeleteManyMediaResult = {
  deleted: number[];
  errors: DeleteManyMediaError[];
};

// What the internal service can update (public fields + system-only SEO filename/timestamp + storage keys).
// Column-shaped: the picked place has already been resolved to `location_id`.
export type UpdateMediaInternalInput = Partial<Omit<MediaSchema, InternalMediaFields>> &
  Partial<Pick<
    MediaSchema,
    | 'location_id'
    | 'is_active'
    | 'seo_filename'
    | 'seo_generated_at'
    | 'url'
    | 'thumbnail'
    | 'previews'
    | 'previews_bytes'
    | 'video_preview'
    | 'video_preview_bytes'
    | 'duration_seconds'
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


/**
 * How a read treats the owner's `is_active` switch. Public reads leave inactive media out; only the
 * owner's editor asks for them, so saving a portfolio/collection can't drop media it never loaded.
 */
export type MediaVisibility = { includeInactive?: boolean };

export type RegenerateMediaThumbnailJobInput = {
  media_id: number;
};
