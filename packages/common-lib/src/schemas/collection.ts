import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== COLLECTION BASE SCHEMA ====================
export type CollectionSchema = {
  id: number;
  title: string;
  slug: string;
  is_featured: boolean;
  is_highlight: boolean;
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
// Only collision fields are prefixed (same pattern as PortfolioFullSchema)
export type CollectionFullSchema = CollectionSchema & {
  // From collection_media
  media_id: number;
  position: number;

  // From media (only collisions prefixed with m_)
  m_id: number;                           // COLLISION: id
  public_id: string;
  m_title?: string | null;                // COLLISION: title
  thumbnail?: string | null;
  url?: string | null;
  shape?: EnumType<'MEDIA_SHAPE'> | null;
  seo_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_filename: string;
  m_is_featured?: boolean | null;         // COLLISION: is_featured
  m_is_highlight?: boolean | null;        // COLLISION: is_highlight
};

const tablesCollectionFull = [
  TABLES_ENUM.COLLECTIONS,
  TABLES_ENUM.COLLECTION_MEDIA,
  TABLES_ENUM.MEDIA,
] as const;
export type CollectionFullSchemaColumns = TableColumn<typeof tablesCollectionFull, CollectionFullSchema>;
