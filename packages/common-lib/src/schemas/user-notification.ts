import { TABLES_ENUM, EnumType } from '../constants/enums';
import { TableColumn } from '../types/database';

export type UserNotificationSchema = {
  id: number;
  type: EnumType<'NOTIFICATION_TYPE'>;
  user_id: number;
  entity_id: number;
  read_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type UserNotificationSchemaWithoutTimestamps = Omit<
  UserNotificationSchema,
  'created_at'
>;

const tablesUserNotification = [TABLES_ENUM.USER_NOTIFICATIONS] as const;
export type UserNotificationSchemaColumns = TableColumn<
  typeof tablesUserNotification,
  UserNotificationSchemaWithoutTimestamps
>;
