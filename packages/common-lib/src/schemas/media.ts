import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== MEDIA SCHEMA ====================
export type MediaSchema = {
  id: number;
  public_id: string;
  title?: string | null;
  description?: string | null;
  bytes: number;
  thumbnail_bytes:number;
  url: string;
  thumbnail?: string | null;
  blocked: boolean;
  shape?: EnumType<'MEDIA_SHAPE'> | null;
  compression_level?: EnumType<'COMPRESSION_LEVEL'> | null;
  extension: string;
  is_active: boolean;
  seo_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_filename: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type MediaSchemaWithoutTimestamps = Omit<MediaSchema, 'created_at' | 'updated_at'>;

const tablesMedia = [TABLES_ENUM.MEDIA] as const;
export type MediaSchemaColumns = TableColumn<typeof tablesMedia, MediaSchemaWithoutTimestamps>;

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

