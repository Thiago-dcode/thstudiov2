import SchemaBuilder from '../builder/schemaBuilder';
import { connectDb, handleMigration } from './utils';
import { databaseCliConfig } from './utils/config';
import Logger from '@repo/backend-lib/utils/console';
import { killClient } from '../client';
import { QueryBuilder } from '../builder/queryBuilder';
import type { MigrationScriptOptions } from './rollback';

const MIGRATION_TABLE_NAME = 'migrations';

/** Large `migrate:refresh` / `db:fresh` runs can exceed a few minutes on slow machines. */
const MIGRATION_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Reconcile legacy ledger rows to the canonical `.js` identity.
 *
 * The compiled CLI runs migrations from `dist/src/migrations` (`.js`), but older
 * runs against the TypeScript source recorded `.ts` names in the `migrations`
 * table. Since `handleMigration` now stores/compares the normalized `.js` name,
 * any leftover `.ts` row would no longer match its file and the migration would
 * be re-applied. Rewrite those rows to `.js` once, dropping duplicates that would
 * violate the UNIQUE(name) constraint.
 */
const normalizeMigrationLedger = async (
  queryBuilder: ReturnType<typeof QueryBuilder.table>,
) => {
  const rows = await QueryBuilder.table(MIGRATION_TABLE_NAME)
    .select(['name'])
    .get<{ name: string }[]>();
  const existing = new Set(rows.map((row) => row.name));
  for (const { name } of rows) {
    const normalized = name.replace(/\.(js|ts)$/i, '') + '.js';
    if (normalized === name) continue;
    if (existing.has(normalized)) {
      // A `.js` row already exists — drop the stale `.ts` duplicate.
      await queryBuilder.where('name', '=', name).delete();
    } else {
      await queryBuilder.where('name', '=', name).update(['name'], [normalized]);
      existing.add(normalized);
    }
    existing.delete(name);
    Logger.info(`🔧 Normalized migration ledger entry: ${name} → ${normalized}`);
  }
};

export const migrate = async (options: MigrationScriptOptions = {}) => {
  const shouldExit = options.exitProcess !== false;
  const timeoutId = setTimeout(() => {
    Logger.error('❌ Migration timeout');
    process.exit(1);
  }, MIGRATION_TIMEOUT_MS);
  try {
    const start = Date.now();
    Logger.info('🔄 Initializing migration process');
    Logger.info(
      `🗂️  Running compiled migrations from ${databaseCliConfig.migrationsDirectory}`,
    );
    await connectDb();
    Logger.info('🔄 Db connected');
    await SchemaBuilder.table(MIGRATION_TABLE_NAME).createIfNotExists([
      'id SERIAL PRIMARY KEY',
      'name VARCHAR(255) NOT NULL UNIQUE',
      'created_at TIMESTAMP NOT NULL',
    ]);
    const queryBuilder = QueryBuilder.table(MIGRATION_TABLE_NAME);
    await normalizeMigrationLedger(queryBuilder);
    let migrationCount = 0;
    await handleMigration(async (loadMigration, migrationName) => {
      const migrationExists = await queryBuilder
        .where('name', '=', migrationName)
        .exists();
      if (migrationExists) return;

      // The list comes from reading the compiled directory, so the file is always
      // there — but load defensively rather than assuming.
      const migration = await loadMigration();
      if (!migration) {
        throw new Error(`Migration file not found: ${migrationName}`);
      }
      Logger.info(`🔄 Migrating ${migrationName}`);
      await migration.up();
      await queryBuilder.insert(
        ['name', 'created_at'],
        [migrationName, new Date()],
      );
      migrationCount++;
      Logger.success(`✅ migrated ${migrationName}`);
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
