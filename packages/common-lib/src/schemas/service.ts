import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== SERVICE BASE SCHEMA ====================
export type ServiceSchema = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  is_active: boolean;
  show_price: boolean;
  user_id: number;
  portfolio_id?: number | null;
  created_at: Date;
  updated_at: Date;
};

export type ServiceSchemaWithoutTimestamps = Omit<ServiceSchema, 'created_at' | 'updated_at'>;

const tablesService = [TABLES_ENUM.SERVICES] as const;
export type ServiceSchemaColumns = TableColumn<typeof tablesService, ServiceSchema>;

// ==================== SERVICE FEATURE SCHEMA ====================
export type ServiceFeatureSchema = {
  id: number;
  title: string;
  service_id: number;
  created_at: Date;
  updated_at: Date;
};

// ==================== SERVICE TERM SCHEMA ====================
export type ServiceTermSchema = {
  id: number;
  title: string;
  service_id: number;
  created_at: Date;
  updated_at: Date;
};

// ==================== SERVICE FULL SCHEMA (WITH FEATURES & TERMS) ====================
// Joins: services + service_features + service_terms
// Collisions: id, title, created_at, updated_at
export type ServiceFullSchema = ServiceSchema & {
  // From service_features (prefixed: sf_)
  sf_id: number;                // COLLISION: id
  sf_title: string;             // COLLISION: title

  // From service_terms (prefixed: st_)
  st_id: number;                // COLLISION: id
  st_title: string;             // COLLISION: title

   // From portfolios (prefixed: p_)
   p_id: number;                // COLLISION: id
   p_title: string;             // COLLISION: title
   p_slug:string;                // COLLISION: slug
};

const tablesServiceFull = [
  TABLES_ENUM.SERVICES,
  TABLES_ENUM.SERVICE_FEATURES,
  TABLES_ENUM.SERVICE_TERMS,
  TABLES_ENUM.PORTFOLIOS,
] as const;
export type ServiceFullSchemaColumns = TableColumn<typeof tablesServiceFull, ServiceFullSchema>;
