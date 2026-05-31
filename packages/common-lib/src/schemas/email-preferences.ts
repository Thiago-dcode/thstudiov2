import { TABLES_ENUM } from '../constants/enums';
import { TableColumn } from '../types/database';

export type EmailPreferenceSchema = {
  id: number;
  email: string;
  token: string;
  user_id: number | null;
  transactional: boolean;
  marketing: boolean;
  notifications: boolean;
  waitlist_updates: boolean;
  created_at: Date;
  updated_at: Date;
};

export type EmailPreferenceSchemaWithoutTimestamps = Omit<EmailPreferenceSchema, 'created_at' | 'updated_at'>;

const tablesEmailPreferences = [TABLES_ENUM.EMAIL_PREFERENCES] as const;
export type EmailPreferenceSchemaColumns = TableColumn<
  typeof tablesEmailPreferences,
  EmailPreferenceSchemaWithoutTimestamps
>;
