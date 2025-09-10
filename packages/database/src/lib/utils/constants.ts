import path from 'node:path';
import { DatabaseSettings } from './types';

// DATABASE SETTINGS
export const DEFAULT_DATABASE_SETTINGS: DatabaseSettings = {
  allowUpdateWithoutWhere: false,
  allowDeleteWithoutWhere: false,
  migrationsDirectory: path.join(__dirname, '../../migrations'),
} as const;
export   const SQL_FUNCTIONS = [
  'NOW()',
  'CURRENT_TIMESTAMP',
  'CURRENT_DATE',
  'CURRENT_TIME',
  'CURRENT_USER',
  'USER',
  'DATABASE()',
  'VERSION()',
  'CONNECTION_ID()',
  'LAST_INSERT_ID()',
  'RAND()',
  'UUID()',
  'UUID_SHORT()',
] as const;
// MIGRATIONS
export const MIGRATION_TABLE_NAME = 'migrations';

// TRIGGERS
export const TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME =
  'update_updated_at_column';

// TABLES
export const TABLES = [
  'plans',
  'plan_translations',
  'plan_characteristics',
  'user_extra_data',
  'users',
  'migrations',
  'languages',
  'language_translations',
] as const;

// ENUMS
export const ENUMS = {
  BILLING_TYPES: ['monthly', 'trimestral', 'yearly', 'lifetime'] as const,
  USER_EDITORS_ROLES: ['admin', 'editor'] as const,
  LANGUAGE_CODE: ['EN', 'ES', 'PT'] as const,
  MEDIA_SHAPE: ['SQUARE', 'LANDSCAPE', 'PORTRAIT'] as const,
};
