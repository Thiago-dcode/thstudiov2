import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

export type AssetSchema = {
  id: number;
  url: string;
  thumbnail?: string | null;
  slug: string;
  title?: string | null;
  description?: string | null;
  filename: string;
  created_at: Date;
  updated_at: Date;
};

export type AssetSchemaWithoutTimestamps = Omit<AssetSchema, 'created_at' | 'updated_at'>;

const tablesAssets = [TABLES_ENUM.ASSETS] as const;
export type AssetSchemaColumns = TableColumn<typeof tablesAssets, AssetSchema>;
