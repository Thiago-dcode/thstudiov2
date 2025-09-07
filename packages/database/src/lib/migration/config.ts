import { DEFAULT_DATABASE_SETTINGS } from '../constants';
import { DatabaseSettings } from '../types';

let migrationConfig: DatabaseSettings = DEFAULT_DATABASE_SETTINGS;

const setMigrationConfig = (config: DatabaseSettings) => {
  migrationConfig = {
    ...DEFAULT_DATABASE_SETTINGS,
    ...config,
  };
};

export { setMigrationConfig, migrationConfig };
