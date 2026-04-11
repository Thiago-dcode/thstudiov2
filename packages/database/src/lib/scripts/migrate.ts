import SchemaBuilder from '../builder/schemaBuilder';
import { connectDb, handleMigration } from './utils';
import Logger from '@repo/backend-lib/utils/console';
import { killClient } from '../client';
import { QueryBuilder } from '../builder/queryBuilder';
import type { MigrationScriptOptions } from './rollback';

const MIGRATION_TABLE_NAME = 'migrations';

/** Large `migrate:refresh` / `db:fresh` runs can exceed a few minutes on slow machines. */
const MIGRATION_TIMEOUT_MS = 15 * 60 * 1000;

export const migrate = async (options: MigrationScriptOptions = {}) => {
  const shouldExit = options.exitProcess !== false;
  const timeoutId = setTimeout(() => {
    Logger.error('❌ Migration timeout');
    process.exit(1);
  }, MIGRATION_TIMEOUT_MS);
  try {
    const start = Date.now();
    Logger.info('🔄 Initializing migration process');
    await connectDb();
     Logger.info('🔄 Db connected');
    await SchemaBuilder.table(MIGRATION_TABLE_NAME).createIfNotExists([
      'id SERIAL PRIMARY KEY',
      'name VARCHAR(255) NOT NULL UNIQUE',
      'created_at TIMESTAMP NOT NULL',
    ]);
    const queryBuilder = QueryBuilder.table(MIGRATION_TABLE_NAME);
    let migrationCount = 0;
    await handleMigration(async (migration, migrationName) => {
      const migrationExists = await queryBuilder
        .where('name', '=', migrationName)
        .exists();
      if (!migrationExists) {
        Logger.info(`🔄 Migrating ${migrationName}`);
        await migration.up();
        await queryBuilder.insert(
          ['name', 'created_at'],
          [migrationName, new Date()],
        );
        migrationCount++;
        Logger.success(`✅ migrated ${migrationName}`);
      }
    });
    if (migrationCount > 0)
      Logger.success(
        `✅ Migration completed in ${((Date.now() - start) / 1000).toFixed(2)}s`,
      );
    else Logger.info('Nothing to migrate');

    if (shouldExit) process.exit(0);
  } catch (error) {
    Logger.error('❌ Migration failed:', error);
    if (shouldExit) process.exit(1);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    await killClient();
  }
};
