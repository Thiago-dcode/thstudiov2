import { DEFAULT_DATABASE_SETTINGS } from '@repo/common-lib/constants/database';
import { DatabaseSettings } from '@repo/common-lib/types/database';

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
