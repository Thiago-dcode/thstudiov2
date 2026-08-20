import { DEFAULT_DATABASE_SETTINGS } from '@repo/common-lib/constants/database';
import { DatabaseSettings } from '@repo/common-lib/types/database';
import { distMigrationsDirectory, distSeedsDirectory } from './paths';

// Database client config, allow migrations and seeds have more control over the database
let databaseCliConfig: DatabaseSettings = {
  ...DEFAULT_DATABASE_SETTINGS,
  allowTruncate: true,
  allowDrop: true,
  allowUpdateWithoutWhere: true,
  allowDeleteWithoutWhere: true,
  // These are *execution* directories: `migrate`, `rollback` and `db:seed` only
  // ever load compiled `.js`. Scaffolding uses the `source*` paths instead — see
  // `./paths`. The defaults in `DEFAULT_DATABASE_SETTINGS` point at `src` and are
  // deliberately overridden here so the CLI can never run TypeScript.
  migrationsDirectory: distMigrationsDirectory,
  seedDirectory: distSeedsDirectory,
};

const setDatabaseCliConfig = (config: DatabaseSettings) => {
  databaseCliConfig = {
    ...DEFAULT_DATABASE_SETTINGS,
    ...config,
  };
};

export { setDatabaseCliConfig, databaseCliConfig };
