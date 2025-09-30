import path from 'node:path';
import { DatabaseSettings, EnumType } from './schemas/database';

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
export const TABLES_ENUM = {
  PLANS:'plans',
  PLAN_PRICES:'plan_prices',
  PLAN_TRANSLATIONS:'plan_translations',
  PLAN_OFFERS:'plan_offers',
  USER_EXTRA_DATA:'user_extra_data',
  ADMIN_USERS:'admin_users',
  ADMIN_USERS_ROLES:'admin_users_roles',
  USERS:'users',
  USER_PLAN_TRANSACTIONS:'user_plan_transactions',
  MIGRATIONS:'migrations',
  MEDIA:'media',
  MEDIA_TRANSLATIONS:'media_translations',
  COLLECTIONS:'collections',
  COLLECTION_MEDIA:'collection_media',
  COLLECTION_TRANSLATIONS:'collection_translations',
  PORTFOLIOS:'portfolios',
  PORTFOLIO_MEDIA:'portfolio_media',
  PORTFOLIO_COLLECTION:'portfolio_collection',
  PORTFOLIO_TRANSLATIONS:'portfolio_translations',
  PROJECTS:'projects',
  PROJECT_MEDIA:'project_media',
  PROJECT_TRANSLATIONS:'project_translations',
  CLIENTS:'clients',
  CLIENT_MEDIA:'client_media',
  CLIENT_TRANSLATIONS:'client_translations',
  SERVICES:'services',
  SERVICE_MEDIA:'service_media',
  SERVICE_TRANSLATIONS:'service_translations',
  ADDRESSES:'addresses',
  USER_AUTH_DEVICES:'user_auth_devices',
  USER_SESSIONS:'user_sessions',
} as const;

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

export const DEFAULT_LANGUAGE: EnumType<'LANGUAGE_CODE'> = 'EN';
