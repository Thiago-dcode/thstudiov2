import { TABLES_ENUM } from '../constants/enums';
import { TableColumn } from '../types/database';

export type UsernameHistorySchema = {
  id: number;
  user_id: number;
  username: string;
  reserved_until: Date;
  created_at: Date;
  updated_at: Date;
};

export type UsernameHistorySchemaWithoutTimestamps = Omit<UsernameHistorySchema, 'created_at' | 'updated_at'>;

const tablesUsernameHistory = [TABLES_ENUM.USERNAME_HISTORY] as const;
export type UsernameHistorySchemaColumns = TableColumn<
  typeof tablesUsernameHistory,
  UsernameHistorySchemaWithoutTimestamps
>;
