import { TABLES_ENUM, EnumType } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== PORTFOLIO BASE SCHEMA ====================
export type PortfolioSchema = {
  id: number;
  slug: string;
  title: string;
  thumbnail: string;
  description?: string | null;
  is_featured: boolean;
  is_highlight: boolean;
  is_active: boolean;
  blocked_at?: Date | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type PortfolioSchemaWithoutTimestamps = Omit<PortfolioSchema, 'created_at' | 'updated_at'>;

const tablesPortfolio = [TABLES_ENUM.PORTFOLIOS] as const;
export type PortfolioSchemaColumns = TableColumn<typeof tablesPortfolio, PortfolioSchema>;

// ==================== PORTFOLIO + ARTIST SCHEMA (WITH JOINED USER) ====================
// Joins: portfolios + users
// Collisions: id
export type PortfolioWithArtistSchema = PortfolioSchema & {
  u_id: number;             // COLLISION: users.id
  email: string;
  username: string;
  name?: string | null;
  surname?: string | null;
  benefit_id: number | null;
  language: EnumType<'LANGUAGE_CODE'>;
};

const tablesPortfolioWithArtist = [TABLES_ENUM.PORTFOLIOS, TABLES_ENUM.USERS] as const;
export type PortfolioWithArtistSchemaColumns = TableColumn<typeof tablesPortfolioWithArtist, PortfolioWithArtistSchema>;

const tablesPortfolioFull = [
  TABLES_ENUM.PORTFOLIOS,
  TABLES_ENUM.USERS,
  TABLES_ENUM.PORTFOLIO_MEDIA,
  TABLES_ENUM.MEDIA,
  TABLES_ENUM.PORTFOLIO_COLLECTION,
  TABLES_ENUM.COLLECTIONS,
  TABLES_ENUM.PORTFOLIO_CATEGORIES,
  TABLES_ENUM.CATEGORIES,
  TABLES_ENUM.CATEGORY_TRANSLATIONS,
  TABLES_ENUM.LAYOUT_CONFIG,
  TABLES_ENUM.LAYOUTS,
] as const;
export type PortfolioFullSchema = PortfolioWithArtistSchema & {
  // From portfolio_media (prefixed: pm_)
  media_id: number;
  position: number;

  // From media (prefixed: m_)
  m_id: number;                           // COLLISION: id
  public_id: string;
  m_title?: string | null;                // COLLISION: title
  m_thumbnail?: string | null;            // COLLISION: thumbnail
  url?: string | null;
  blocked_at?: Date | null;
  shape?: EnumType<'MEDIA_SHAPE'> | null;
  aspect_ratio?: EnumType<'ASPECT_RATIO'> | null;
  /** From joined `media` row (collision with `portfolios.is_active`). */
  m_is_active?: boolean | null;
  seo_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_filename: string;
  m_user_id: number;                      // COLLISION: user_id
  m_is_featured?: boolean | null;
  m_is_highlight?: boolean | null;

  // From portfolio_categories + categories + category_translations (prefixed: c_)
  c_id?: number | null;                   // COLLISION: id
  c_name?: string | null;                 // COLLISION: name (resolved via COALESCE with translation)
  c_slug?: string | null;                 // COLLISION: slug
  c_is_featured?: boolean | null;
  c_is_active?: boolean | null;

  // From layout_config + layouts (1:1, no collision with main portfolio cols)
  layout_id?: number | null;
  config?: Record<string, unknown> | null;
  layout_name?: EnumType<'LAYOUT_TYPE'> | null;
};
export type PortfolioFullSchemaColumns = TableColumn<typeof tablesPortfolioFull, PortfolioFullSchema>;
