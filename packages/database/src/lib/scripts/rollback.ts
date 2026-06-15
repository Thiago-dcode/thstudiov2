import SchemaBuilder from '../builder/schemaBuilder';
import { connectDb, handleMigration } from './utils';
import Logger from '@repo/backend-lib/utils/console';
import { killClient } from '../client';
import { QueryBuilder } from '../builder/queryBuilder';
const MIGRATION_TABLE_NAME = 'migrations';

export type MigrationScriptOptions = { exitProcess?: boolean };

export const rollback = async (
  steps: number | null = null,
  options: MigrationScriptOptions = {},
) => {
  const shouldExit = options.exitProcess !== false;
  try {
    const start = Date.now();
    Logger.info('🔄 Initializing rollback process');
    await connectDb();
    const exists = await SchemaBuilder.table(MIGRATION_TABLE_NAME).exists();
    if (!exists) {
      Logger.error(
        '❌ Migration table does not exist, you must run the migration command first',
      );
      if (shouldExit) process.exit(1);
      // Allow callers like `migrate:refresh` (exitProcess: false) to continue
      // and run `migrate`, which will create the migrations table.
      return;
    }
    const queryBuilder = QueryBuilder.table(MIGRATION_TABLE_NAME);
    const stepCount = steps;
    let rollbackCount = 0;
    await handleMigration(async (migration, migrationName) => {
      const migrationExists = await queryBuilder
        .where('name', '=', migrationName)
        .exists();
      if (
        migrationExists &&
        (stepCount === null || rollbackCount < stepCount)
      ) {
        await migration.down();
        await queryBuilder.where('name', '=', migrationName).delete();
        rollbackCount++;
        Logger.success(`↩️ Rolled back ${migrationName}`);
      }
    }, true);
    if (rollbackCount > 0)
      Logger.success(
        `↩️ Rollback completed in ${((Date.now() - start) / 1000).toFixed(2)}s`,
      );
    else Logger.info('Nothing to rollback');

    if (shouldExit) process.exit(0);
  } catch (error) {
    Logger.error('❌ Rollback failed:', error);
    if (shouldExit) process.exit(1);
    throw error;
  } finally {
    await killClient();
  }
};
