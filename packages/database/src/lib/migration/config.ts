import { DEFAULT_DATABASE_SETTINGS } from '../utils/constants';
import { DatabaseSettings } from '../utils/types';

let migrationConfig: DatabaseSettings = DEFAULT_DATABASE_SETTINGS;

const setMigrationConfig = (config: DatabaseSettings) => {
  migrationConfig = {
    ...DEFAULT_DATABASE_SETTINGS,
    ...config,
  };
};

export { setMigrationConfig, migrationConfig };
