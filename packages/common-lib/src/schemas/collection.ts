import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== COLLECTION BASE SCHEMA ====================
export type CollectionSchema = {
  id: number;
  title: string;
  description?: string | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type CollectionSchemaWithoutTimestamps = Omit<CollectionSchema, 'created_at' | 'updated_at'>;

const tablesCollection = [TABLES_ENUM.COLLECTIONS] as const;
export type CollectionSchemaColumns = TableColumn<typeof tablesCollection, CollectionSchema>;

// ==================== COLLECTION FULL SCHEMA (WITH MEDIA) ====================
// Joins: collections + collection_media + media
// Collisions: id, title, description, user_id, created_at, updated_at
export type CollectionFullSchema = CollectionSchema & {
  // From collection_media (prefixed: cm_)
  cm_id: number;                          // COLLISION: id
  cm_collection_id: number;
  cm_media_id: number;
  cm_position: number;
  
  // From media (prefixed: m_)
  m_id: number;                           // COLLISION: id
  m_public_id: string;
  m_title?: string | null;                // COLLISION: title
  m_description?: string | null;          // COLLISION: description
  m_bytes: number;
  m_thumbnail_bytes: number;
  m_url: string;
  m_thumbnail?: string | null;
  m_blocked: boolean;
  m_shape?: EnumType<'MEDIA_SHAPE'> | null;
  m_compression_level?: EnumType<'COMPRESSION_LEVEL'> | null;
  m_extension: string;
  m_is_active: boolean;
  m_seo_alt?: string | null;
  m_seo_title?: string | null;
  m_seo_description?: string | null;
  m_seo_filename: string;
  m_user_id: number;                      // COLLISION: user_id
  m_created_at: Date;                     // COLLISION: created_at
  m_updated_at: Date;                     // COLLISION: updated_at
};

const tablesCollectionFull = [
  TABLES_ENUM.COLLECTIONS,
  TABLES_ENUM.COLLECTION_MEDIA,
  TABLES_ENUM.MEDIA,
] as const;
export type CollectionFullSchemaColumns = TableColumn<typeof tablesCollectionFull, CollectionFullSchema>;
