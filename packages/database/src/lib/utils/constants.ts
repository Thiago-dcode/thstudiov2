import path from 'node:path';
import { DatabaseSettings } from './types';

// DATABASE SETTINGS
export const DEFAULT_DATABASE_SETTINGS: DatabaseSettings = {
  allowUpdateWithoutWhere: false,
  allowDeleteWithoutWhere: false,
  migrationsDirectory: path.join(__dirname, '../../migrations'),
} as const;

// MIGRATIONS
export const MIGRATION_TABLE_NAME = 'migrations';

// TRIGGERS
export const TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME =
  'update_updated_at_column';

// TABLES
export const TABLES = [
  'plans',
  'plan_characteristics',
  'user_extra_data',
  'users',
  'migrations',
] as const;

// ENUMS
export const ENUMS = {
  BILLING_TYPES: ['monthly', 'yearly', 'lifetime'] as const,
  USER_EDITORS_ROLES: ['admin', 'editor'] as const,
};
