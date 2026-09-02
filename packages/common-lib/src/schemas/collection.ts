import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== COLLECTION BASE SCHEMA ====================
export type CollectionSchema = {
  id: number;
  title: string;
  slug: string;
  is_featured: boolean;
  is_highlight: boolean;
  is_active: boolean;
  is_indexable: boolean;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_generated_at?: Date | null;
  description?: string | null;
  blocked_at?: Date | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type CollectionSchemaWithoutTimestamps = Omit<CollectionSchema, 'created_at' | 'updated_at'>;

const tablesCollection = [TABLES_ENUM.COLLECTIONS] as const;
export type CollectionSchemaColumns = TableColumn<typeof tablesCollection, CollectionSchema>;


export type CollectionCompactSchema = CollectionSchema & {
  // From collection_media
  position: number;
  // From media (only collisions prefixed with m_)
  m_id: number;                           // COLLISION: id
  m_title?: string | null;                // COLLISION: title
  thumbnail?: string | null;
  url?: string | null;
}
// ==================== COLLECTION FULL SCHEMA (WITH MEDIA) ====================
// Joins: collections + collection_media + media
// Only collision fields are prefixed (same pattern as PortfolioFullSchema)
export type CollectionFullSchema = CollectionCompactSchema & {
  public_id: string;
  shape?: EnumType<'MEDIA_SHAPE'> | null;
  aspect_ratio?: EnumType<'ASPECT_RATIO'> | null;
  media_type?: EnumType<'MEDIA_TYPE'> | null;
  m_seo_title?: string | null;            // COLLISION: collections.seo_title
  m_seo_description?: string | null;      // COLLISION: collections.seo_description
  seo_alt?: string | null;                // media only — no collision
  seo_filename: string;                   // media only — no collision
};

const tablesCollectionFull = [
  TABLES_ENUM.COLLECTIONS,
  TABLES_ENUM.COLLECTION_MEDIA,
  TABLES_ENUM.MEDIA,
] as const;
export type CollectionFullSchemaColumns = TableColumn<typeof tablesCollectionFull, CollectionFullSchema>;

// ==================== PORTFOLIO COLLECTION SCHEMA (WITH MEDIA) ====================
// Joins: portfolio_collection + collections + collection_media + media
// Only collision fields are prefixed with `pc_` for portfolio_collection
export type PortfolioCollectionSchema = CollectionCompactSchema & {
  // From portfolio_collection (aliased, key required so the SELECT `as` clause typechecks)
  pc_position: number;          // COLLISION: position (collection_media.position)
};

export type FullPortfolioCollectionSchema = CollectionFullSchema & {
  // From portfolio_collection (aliased, key required so the SELECT `as` clause typechecks)
  pc_position: number;          // COLLISION: position (collection_media.position)
};

const tablesPortfolioCollection = [
  TABLES_ENUM.PORTFOLIO_COLLECTION,
  TABLES_ENUM.COLLECTIONS,
  TABLES_ENUM.COLLECTION_MEDIA,
  TABLES_ENUM.MEDIA,
] as const;
export type PortfolioCollectionSchemaColumns = TableColumn<typeof tablesPortfolioCollection, PortfolioCollectionSchema>;
export type FullPortfolioCollectionSchemaColumns = TableColumn<typeof tablesPortfolioCollection, FullPortfolioCollectionSchema>;
