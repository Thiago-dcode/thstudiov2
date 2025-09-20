import path from 'node:path';
import { DatabaseSettings } from './schemas/database';

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
// MIGRATIONS
export const MIGRATION_TABLE_NAME = 'migrations';

// TRIGGERS
export const TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME =
  'update_updated_at_column';
export const TRIGGER_UPDATE_CREATED_AT_FUNCTION_NAME =
  'update_created_at_column';

// TABLES
export const TABLES = [
  'plans',
  'plan_prices',
  'plan_translations',
  'plan_offers',
  'user_extra_data',
  'admin_users',
  'admin_users_roles',
  'users',
  'user_plan_transactions',
  'migrations',
  'media',
  'media_translations',
  'collections',
  'collection_media',
  'collection_translations',
  'portfolios',
  'portfolio_media',
  'portfolio_collection',
  'portfolio_translations',
  'projects',
  'project_media',
  'project_translations',
  'clients',
  'client_media',
  'client_translations',
  'services',
  'service_media',
  'service_translations',
  'addresses',
] as const;

// ENUMS
export const ENUMS = {
  BILLING_TYPES: ['MONTHLY', 'TRIMESTAL', 'YEARLY', 'LIFETIME'] as const,
  USER_EDITORS_ROLES: ['ADMIN', 'EDITOR'] as const,
  LANGUAGE_CODE: ['EN', 'ES', 'PT'] as const,
  MEDIA_TYPE: ['IMAGE', 'VIDEO'] as const,
  MEDIA_EXTENSION: ['JPG', 'JPEG', 'PNG', 'GIF', 'MP4', 'MOV'] as const,
  MEDIA_SHAPE: ['SQUARE', 'LANDSCAPE', 'PORTRAIT'] as const,
  PROJECT_STATUS: [
    'NOT_STARTED',
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'PENDING_PAYMENT',
    'PAUSED',
  ] as const,
  TRANSACTION_STATUS: ['PENDING', 'SUCCESS', 'FAILED'] as const,
  PAYMENT_STATUS: ['PENDING', 'SUCCESS', 'FAILED'] as const,
  PAYMENT_METHOD: ['CARD', 'PAYPAL', 'BANK_TRANSFER'] as const,
  PLAN_OFFERS_TYPES: ['FREE', 'DISCOUNT'] as const,
};
