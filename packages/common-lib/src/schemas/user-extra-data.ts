import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

export type UserExtraDataSchema = {
  id: number;
  media_size: number;
  media_count: number;
  projects_count: number;
  clients_count: number;
  services_count: number;
  portfolios_count: number;
  storage_requests_count: number;
  last_storage_request_date: Date;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type UserExtraDataSchemaWithoutTimestamps = Omit<UserExtraDataSchema, 'created_at' | 'updated_at'>;

const tablesUserExtraData = [TABLES_ENUM.USER_EXTRA_DATA] as const;
export type UserExtraDataSchemaColumns = TableColumn<typeof tablesUserExtraData, UserExtraDataSchemaWithoutTimestamps>;
