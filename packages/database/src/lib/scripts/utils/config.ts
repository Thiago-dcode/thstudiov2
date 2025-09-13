import { DEFAULT_DATABASE_SETTINGS } from '../../constants/constants';
import { DatabaseSettings } from '../../constants/types';

let migrationConfig: DatabaseSettings = DEFAULT_DATABASE_SETTINGS;

const setMigrationConfig = (config: DatabaseSettings) => {
  migrationConfig = {
    ...DEFAULT_DATABASE_SETTINGS,
    ...config,
  };
};

export { setMigrationConfig, migrationConfig };
