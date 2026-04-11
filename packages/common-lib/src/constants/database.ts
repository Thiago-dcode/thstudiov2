import path from 'node:path';
import { DatabaseSettings } from '../types/database';

// DATABASE SETTINGS
export const DEFAULT_DATABASE_SETTINGS: DatabaseSettings = {
  allowUpdateWithoutWhere: false,
  allowDeleteWithoutWhere: false,
  allowTruncate: false,
  allowDrop: false,
  migrationsDirectory: path.join(process.cwd(), 'src', 'migrations'),
  seedDirectory: path.join(process.cwd(), 'src', 'seeds'),
} as const;
export const SQL_FUNCTIONS = [
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

export const SQL_CLAUSES = {
  '=': '=',
  '>': '>',
  '<': '<',
  '>=': '>=',
  '<=': '<=',
  '!=': '!=',
  LIKE: 'LIKE',
  ILIKE: 'ILIKE',
  'NOT ILIKE': 'NOT ILIKE',
  'NOT LIKE': 'NOT LIKE',
  IN: 'IN',
  'NOT IN': 'NOT IN',
  IS: 'IS',
  'IS NOT': 'IS NOT',
} as const;

// MIGRATIONS
export const MIGRATION_TABLE_NAME = 'migrations';

// TRIGGERS
export const TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME =
  'update_updated_at_column';
export const TRIGGER_UPDATE_CREATED_AT_FUNCTION_NAME =
  'update_created_at_column';


