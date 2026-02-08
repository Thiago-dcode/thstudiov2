import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== PORTFOLIO BASE SCHEMA ====================
export type PortfolioSchema = {
  id: number;
  slug: string;
  title: string;
  thumbnail: string;
  description?: string | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type PortfolioSchemaWithoutTimestamps = Omit<PortfolioSchema, 'created_at' | 'updated_at'>;

const tablesPortfolio = [TABLES_ENUM.PORTFOLIOS] as const;
export type PortfolioSchemaColumns = TableColumn<typeof tablesPortfolio, PortfolioSchema>;

// ==================== PORTFOLIO FULL SCHEMA (WITH MEDIA & COLLECTIONS) ====================
// Joins: portfolios + portfolio_media + media + portfolio_collection + collections
// Collisions: id, title, description, thumbnail, user_id, created_at, updated_at
export type PortfolioFullSchema = PortfolioSchema & {
  // From portfolio_media (prefixed: pm_)
  pm_id: number;                          // COLLISION: id
  pm_portfolio_id: number;
  pm_media_id: number;
  pm_position: number;
  
  // From media (prefixed: m_)
  m_id: number;                           // COLLISION: id
  m_public_id: string;
  m_title?: string | null;                // COLLISION: title
  m_description?: string | null;          // COLLISION: description
  m_bytes: number;
  m_thumbnail_bytes: number;
  m_url: string;
  m_thumbnail?: string | null;            // COLLISION: thumbnail
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

  // From portfolio_collection (prefixed: pc_)
  pc_id: number;                          // COLLISION: id
  pc_portfolio_id: number;
  pc_collection_id: number;
  pc_position: number;
  
  // From collections (prefixed: c_)
  c_id: number;                           // COLLISION: id
  c_title: string;                        // COLLISION: title
  c_description?: string | null;          // COLLISION: description
  c_user_id: number;                      // COLLISION: user_id
  c_created_at: Date;                     // COLLISION: created_at
  c_updated_at: Date;                     // COLLISION: updated_at
};

const tablesPortfolioFull = [
  TABLES_ENUM.PORTFOLIOS,
  TABLES_ENUM.PORTFOLIO_MEDIA,
  TABLES_ENUM.MEDIA,
  TABLES_ENUM.PORTFOLIO_COLLECTION,
  TABLES_ENUM.COLLECTIONS,
] as const;
export type PortfolioFullSchemaColumns = TableColumn<typeof tablesPortfolioFull, PortfolioFullSchema>;
