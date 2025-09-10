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
    Logger.info('🔄 Initializing migration process');
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
      await SchemaBuilder.table(MIGRATION_TABLE_NAME).create([
        'id SERIAL PRIMARY KEY',
        'name VARCHAR(255) NOT NULL UNIQUE',
        'created_at TIMESTAMP NOT NULL',
      ]);
    }
    const queryBuilder = QueryBuilder.table(MIGRATION_TABLE_NAME);
    // Now we can safely use SchemaBuilder
    let migrationCount = 0;
    await handleMigration(async (migration, migrationName) => {
      const migrationExists = await queryBuilder
        .where('name', '=', migrationName)
        .exists();
      if (!migrationExists) {
        await migration.up();
        await queryBuilder.insert(
          ['name', 'created_at'],
          [migrationName, new Date()],
        );
        migrationCount++;
        Logger.success(
          `✅ migrated ${migrationName} successfully in ${((Date.now() - start) / 1000).toFixed(2)}s`,
        );
      }
    });
    if (migrationCount > 0)
      Logger.success(
        `✅ Migration completed in ${((Date.now() - start) / 1000).toFixed(2)}s`,
      );
    else Logger.info('Nothing to migrate');

    process.exit(0);
  } catch (error) {
    Logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
})();
