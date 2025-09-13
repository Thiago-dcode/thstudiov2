import SchemaBuilder from '../builder/schemaBuilder';
import { connectDb, handleMigration } from './utils';
import Logger from '@repo/backend-lib/utils/console';
import { killClient } from '../client';
import { QueryBuilder } from '../builder/queryBuilder';
const MIGRATION_TABLE_NAME = 'migrations';
export const migrate = async (tries: number = 3) => {
  setTimeout(
    () => {
      Logger.error('❌ Migration timeout');
      process.exit(1);
    },
    1 * 60 * 1000,
  );
  // 1 minute
  try {
    const start = Date.now();
    Logger.info('🔄 Initializing migration process');
    await connectDb();
    await SchemaBuilder.table(MIGRATION_TABLE_NAME).createIfNotExists([
      'id SERIAL PRIMARY KEY',
      'name VARCHAR(255) NOT NULL UNIQUE',
      'created_at TIMESTAMP NOT NULL',
    ]);

    Logger.info('✅ Database connected successfully');
    const queryBuilder = QueryBuilder.table(MIGRATION_TABLE_NAME);
    // Now we can safely use SchemaBuilder
    let migrationCount = 0;
    await handleMigration(async (migration, migrationName) => {
      const migrationExists = await queryBuilder
        .where('name', '=', migrationName)
        .exists();
      if (!migrationExists) {
        Logger.info(`🔄 Running migration: ${migrationName}`);

        // Test database connection before running migration
        try {
          await SchemaBuilder.raw('SELECT 1');
        } catch (error) {
          Logger.error(
            `❌ Database connection lost before migration ${migrationName}:`,
            error,
          );
          throw error;
        }

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
  } finally {
    await killClient();
  }
};
