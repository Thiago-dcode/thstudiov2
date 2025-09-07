import path from 'node:path';
import { DatabaseSettings } from './types';

export const DEFAULT_DATABASE_SETTINGS: DatabaseSettings = {
  allowUpdateWithoutWhere: false,
  allowDeleteWithoutWhere: false,
  migrationsDirectory: path.join(__dirname, '../migrations'),
};
