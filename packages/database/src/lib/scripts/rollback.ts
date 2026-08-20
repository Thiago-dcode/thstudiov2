import SchemaBuilder from '../builder/schemaBuilder';
import { connectDb, handleMigration } from './utils';
import { databaseCliConfig } from './utils/config';
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
    Logger.info(
      `🗂️  Rolling back compiled migrations from ${databaseCliConfig.migrationsDirectory}`,
    );
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
    let orphanCount = 0;
    // Names come straight from the ledger (newest first), so every entry is by
    // definition already applied — no need to re-check existence per row.
    await handleMigration(async (loadMigration, migrationName) => {
      // Stop before loading anything else once the `--steps` budget is spent.
      if (stepCount !== null && rollbackCount >= stepCount) return 'stop';

      const migration = await loadMigration();
      if (!migration) {
        // The ledger says this ran, but its compiled file is gone — there is no
        // `down()` left to execute. Skipping keeps the remaining migrations
        // rollable instead of bricking the command on one dead row.
        orphanCount++;
        Logger.warn(
          `⚠️  Skipping ${migrationName}: recorded as applied but no compiled file exists, so it cannot be reversed.`,
        );
        return;
      }

      await migration.down();
      await queryBuilder.where('name', '=', migrationName).delete();
      rollbackCount++;
      Logger.success(`↩️ Rolled back ${migrationName}`);
    }, true);
    if (orphanCount > 0) {
      Logger.warn(
        `⚠️  ${orphanCount} ledger row(s) had no migration file. If they are leftovers from a deleted migration, clear them with: DELETE FROM ${MIGRATION_TABLE_NAME} WHERE name = '<name>';`,
      );
    }
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
