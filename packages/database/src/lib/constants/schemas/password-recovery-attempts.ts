import { TABLES_ENUM } from '../constants';
import { TableColumn } from './database';

// Password Recovery Attempt type based on the password_recovery_attempts table structure
export type PasswordRecoveryAttemptSchema = {
  id: number;
  user_id: number;
  user_auth_device_id: number;
  code: string;
  fallback_url: string;
  code_validated: boolean;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};
export type PasswordRecoveryAttemptSchemaWithUser = PasswordRecoveryAttemptSchema & 
{
  email: string;
  username: string;
};

const tablesPasswordRecoveryAttempt = [TABLES_ENUM.PASSWORD_RECOVERY_ATTEMPTS] as const;
export type PasswordRecoveryAttemptColumns = TableColumn<typeof tablesPasswordRecoveryAttempt, PasswordRecoveryAttemptSchema>;
const tablesPasswordRecoveryAttemptWithUser = [TABLES_ENUM.PASSWORD_RECOVERY_ATTEMPTS, TABLES_ENUM.USERS] as const;
export type PasswordRecoveryAttemptColumnsWithUser = TableColumn<typeof tablesPasswordRecoveryAttemptWithUser, PasswordRecoveryAttemptSchemaWithUser>;
const tablesPasswordRecoveryAttemptWithDevice = [TABLES_ENUM.PASSWORD_RECOVERY_ATTEMPTS, TABLES_ENUM.USER_AUTH_DEVICES] as const;
export type PasswordRecoveryAttemptColumnsWithDevice = TableColumn<typeof tablesPasswordRecoveryAttemptWithDevice, PasswordRecoveryAttemptSchema>;
// Input types for creating/updating password recovery attempts
export type CreatePasswordRecoveryAttemptInput = Omit<
  PasswordRecoveryAttemptSchema,
  'id' | 'created_at' | 'updated_at'
>;

export type UpdatePasswordRecoveryAttemptInput = Partial<CreatePasswordRecoveryAttemptInput>;

