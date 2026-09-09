import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== MEDIA SCHEMA ====================
export type MediaSchema = {
  id: number;
  public_id: string;
  title?: string;
  description?: string;
  bytes: number;
  thumbnail_bytes:number;
  url?: string | null;
  thumbnail?: string;
  /**
   * VIDEO only: ordered storage keys of the frames sampled across the clip (near-start, middle,
   * near-end). `thumbnail` points at `previews[0]` — the same object, not a copy — so every
   * consumer that already reads a thumbnail keeps reading a real static WebP.
   */
  previews?: string[] | null;
  /** Total bytes of every key in {@link previews}, `thumbnail`'s own included. */
  previews_bytes?: number | null;
  /**
   * VIDEO only: the short playable clip. Equals `url` when the source was already short enough
   * to be its own preview, so callers must not assume it is a distinct object.
   */
  video_preview?: string | null;
  video_preview_bytes?: number | null;
  is_featured: boolean;
  is_value_pillars: boolean;
  is_highlight: boolean;
  blocked_at?: Date | null;
  shape?: EnumType<'MEDIA_SHAPE'>;
  aspect_ratio: EnumType<'ASPECT_RATIO'>;
  compression_level?: EnumType<'COMPRESSION_LEVEL'>;
  media_type?: EnumType<'MEDIA_TYPE'> | null;
  extension?: string | null;
  is_active: boolean;
  status: EnumType<'MEDIA_STATUS'>;
  completed_at?: Date | null;
  failed_reason?: string | null;
  seo_alt?: string;
  seo_title?: string;
  seo_description?: string;
  seo_filename: string;
  /** Internal: when AI SEO was last generated. Never returned in API responses. */
  seo_generated_at?: Date | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type MediaSchemaWithoutTimestamps = Omit<MediaSchema, 'created_at' | 'updated_at'>;


const tablesMedia = [TABLES_ENUM.MEDIA] as const;
export type MediaSchemaColumns = TableColumn<typeof tablesMedia, MediaSchema>;

export type MediaWithUserSchema = MediaSchema & {
  u_id: number;              // COLLISION: id
  username: string;
  name?: string | null;
  surname?: string | null;
}

const tablesMediaWithUser = [TABLES_ENUM.MEDIA, TABLES_ENUM.USERS] as const;
export type MediaWithUserSchemaColumns = TableColumn<typeof tablesMediaWithUser, MediaWithUserSchema>;

// ==================== MEDIA WITH TRANSLATIONS SCHEMA ====================
export type MediaWithTranslationsSchema = MediaSchema & {
  tr_id?: number;
  tr_name?: string;
  tr_description?: string;
  language_code?: EnumType<'LANGUAGE_CODE'>;
  media_id?: number;
};

const tablesMediaWithTranslations = [TABLES_ENUM.MEDIA, TABLES_ENUM.MEDIA_TRANSLATIONS] as const;
export type MediaWithTranslationsSchemaColumns = TableColumn<typeof tablesMediaWithTranslations, MediaWithTranslationsSchema>;

// ==================== MEDIA TRANSLATIONS SCHEMA ====================
export type MediaTranslationSchema = {
  id: number;
  name: string;
  description: string;
  language_code: EnumType<'LANGUAGE_CODE'>;
  media_id: number;
};

const tablesMediaTranslations = [TABLES_ENUM.MEDIA_TRANSLATIONS] as const;
export type MediaTranslationSchemaColumns = TableColumn<typeof tablesMediaTranslations, MediaTranslationSchema>;

