import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== ADDRESS SCHEMA ====================
export type AddressSchema = {
  id: number;
  formated_address?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  user_id?: number | null;
  client_id?: number | null;
  created_at: Date;
  updated_at: Date;
};

export type AddressSchemaWithoutTimestamps = Omit<AddressSchema, 'created_at' | 'updated_at'>;

const tablesAddress = [TABLES_ENUM.ADDRESSES] as const;
export type AddressSchemaColumns = TableColumn<typeof tablesAddress, AddressSchema>;
