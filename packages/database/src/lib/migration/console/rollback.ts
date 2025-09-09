import SchemaBuilder from '../../builder/schemaBuilder';
import { handleMigration } from '../utils';
import Logger from '@repo/backend-lib/utils/console';
import { initClient } from '../../client';
import config from '@repo/backend-lib/config';
import { QueryBuilder } from '../../builder/queryBuilder';
const MIGRATION_TABLE_NAME = 'migrations';

(async () => {
  try {
    const start = Date.now();
    Logger.info('Initializing rollback process');
    const dbConfig = config().database;
    await initClient({
      client: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
    });
    const exists = await SchemaBuilder.table(MIGRATION_TABLE_NAME).exists();
    if (!exists) {
      Logger.error('Migration table does not exist');
      process.exit(1);
    }
    const queryBuilder = QueryBuilder.table(MIGRATION_TABLE_NAME);
    // Now we can safely use SchemaBuilder
    const steps = process.argv[2] ? parseInt(process.argv[2]) : null;
    let rollbackCount = 0;
    await handleMigration(async (migration, migrationName) => {
      const migrationExists = await queryBuilder
        .where('name', '=', migrationName)
        .exists();
      if (migrationExists && (steps === null || rollbackCount < steps)) {
        await migration.down();
        await queryBuilder.where('name', '=', migrationName).delete();
        rollbackCount++;
        Logger.success(
          `Rolled back ${migrationName} successfully, took: ${((Date.now() - start) / 1000).toFixed(2)}s`,
        );
      }
    }, true);
    Logger.success(
      rollbackCount > 0
        ? `Rollback completed, took: ${((Date.now() - start) / 1000).toFixed(2)}s`
        : 'Nothing to rollback',
    );
    process.exit(0);
  } catch (error) {
    Logger.error('Migration failed:', error);
    process.exit(1);
  }
})();
