import { TABLES_ENUM, EnumType } from '../constants/enums';
import { TableColumn } from '../types/database';

// ==================== LAYOUTS BASE SCHEMA ====================
export type LayoutSchema = {
  id: number;
  name: EnumType<'LAYOUT_TYPE'>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type LayoutSchemaWithoutTimestamps = Omit<
  LayoutSchema,
  'created_at' | 'updated_at'
>;

const tablesLayout = [TABLES_ENUM.LAYOUTS] as const;
export type LayoutSchemaColumns = TableColumn<
  typeof tablesLayout,
  LayoutSchemaWithoutTimestamps
>;

// ==================== LAYOUT_CONFIG SCHEMA ====================
export type LayoutConfigSchema = {
  id: number;
  layout_id: number;
  portfolio_id: number;
  config: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

export type LayoutConfigSchemaWithoutTimestamps = Omit<
  LayoutConfigSchema,
  'created_at' | 'updated_at'
>;

const tablesLayoutConfig = [TABLES_ENUM.LAYOUT_CONFIG] as const;
export type LayoutConfigSchemaColumns = TableColumn<
  typeof tablesLayoutConfig,
  LayoutConfigSchemaWithoutTimestamps
>;
