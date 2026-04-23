import { TABLES_ENUM } from '../constants/enums';
import { TableColumn } from '../types/database';

export type ClientSchema = {
  id: number;
  name: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  logo?: string | null;
  website?: string | null;
  is_active: boolean;
  blocked_at?: Date | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type ClientSchemaWithoutTimestamps = Omit<ClientSchema, 'created_at' | 'updated_at'>;

const tablesClient = [TABLES_ENUM.CLIENTS] as const;
export type ClientSchemaColumns = TableColumn<typeof tablesClient, ClientSchema>;
