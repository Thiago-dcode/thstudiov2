import { TABLES_ENUM } from "../constants/enums";
import { TableColumn } from "../types/database";

// ==================== USER STORAGE REQUEST SCHEMA ====================
export type UserStorageRequestSchema = {
  id: number;
  path: string;
  bytes: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
};

export type UserStorageRequestSchemaWithoutTimestamps = Omit<UserStorageRequestSchema, 'created_at' | 'updated_at'>;

const tablesUserStorageRequest = [TABLES_ENUM.USER_STORAGE_REQUESTS] as const;
export type UserStorageRequestSchemaColumns = TableColumn<typeof tablesUserStorageRequest, UserStorageRequestSchemaWithoutTimestamps>;

