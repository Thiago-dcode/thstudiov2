import { DEFAULT_DATABASE_SETTINGS } from '../../constants/constants';
import { DatabaseSettings } from '../../constants/types/database';

// Database client config, allow migrations and seeds have more control over the database
let databaseCliConfig: DatabaseSettings = {
  ...DEFAULT_DATABASE_SETTINGS,
  allowTruncate: true,
  allowDrop: true,
  allowUpdateWithoutWhere: true,
  allowDeleteWithoutWhere: true,
};

const setDatabaseCliConfig = (config: DatabaseSettings) => {
  databaseCliConfig = {
    ...DEFAULT_DATABASE_SETTINGS,
    ...config,
  };
};

export { setDatabaseCliConfig, databaseCliConfig };
