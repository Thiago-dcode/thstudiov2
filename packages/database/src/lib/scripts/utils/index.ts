import { databaseCliConfig } from './config';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Query } from '../../facades';
import { DatabaseClient } from '@repo/common-lib/types/database';
import Logger from '@repo/backend-lib/utils/console';
import { initClient } from '../../client';
import {config} from '@repo/common-lib/config';
import {
  createUpdatedAtTrigger,
  createCreatedAtTrigger,
  createTimeStampsTrigger,
} from './triggers';
import {
  migrationNamesMatch,
} from './migration-names';

const handleMigration = async (
  callback: (migration: any, migrationName: string) => Promise<void>,
  rollback: boolean = false,
) => {
  try {
    const migrationDirectory = databaseCliConfig.migrationsDirectory;
    if (!fs.existsSync(migrationDirectory)) {
      fs.mkdirSync(migrationDirectory, { recursive: true });
    }
    const migrationFiles = fs
      .readdirSync(migrationDirectory)
      .filter(
        (file) =>
          (file.endsWith('.js') || file.endsWith('.ts')) &&
          !file.endsWith('.d.ts'),
      );

    let migrations: string[];

    if (!rollback) {
      // Sort alphabetically — filename prefix matches chronological order.
      migrations = migrationFiles.sort((a, b) => a.localeCompare(b));
    } else {
      // Roll back in reverse migration order (newest first), not by DB
      // `created_at`. Duplicate `.ts`/`.js` rows from dist re-runs can put
      // older tables (e.g. media) ahead of dependents (e.g. collection_media).
      const appliedRows = await Query.table('migrations').select('name').get();
      const appliedNames = appliedRows.map((row: { name: string }) => row.name);

      migrations = migrationFiles
        .filter((file) =>
          appliedNames.some((dbName) => migrationNamesMatch(file, dbName)),
        )
        .sort((a, b) => b.localeCompare(a));
    }

    if (migrations.length === 0) {
      Logger.info(
        `No migrations ${!rollback ? '' : 'to rollback'} found`,
      );
      // Important: don't hard-exit from here. Callers (e.g. db:fresh with
      // exitProcess: false) should decide whether the process should continue.
      return;
    }

    for (const migration of migrations) {
      const migrationPath = path.join(migrationDirectory, migration);
      if (!fs.existsSync(migrationPath)) {
        Logger.error('❌ Migration file not found', migrationPath);
        throw new Error(`Migration file not found: ${migrationPath}`);
      }
      const migrationFile = await import(pathToFileURL(migrationPath).href);
      if (!migrationFile.up || !migrationFile.down) {
        Logger.error(
          '❌ Migration file is not valid, missing up or down function',
          migrationPath,
        );
        throw new Error(`Invalid migration file (missing up/down): ${migrationPath}`);
      }
      await callback(migrationFile, migration);
    }
  } catch (error) {
    Logger.error(
      rollback ? '❌ Rollback failed:' : '❌ Migration failed:',
      error,
    );
    throw error;
  }
};
const utilsPath = (fileName: string) => {
  return path.join(process.cwd(), 'src', 'lib', 'scripts', 'utils', fileName);
};
const connectDb = async () => {
  const dbConfig = config().database;
  await initClient({
    client: dbConfig.client as DatabaseClient,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    settings: databaseCliConfig,
  });
};
export {
  handleMigration,
  createUpdatedAtTrigger,
  connectDb,
  createCreatedAtTrigger,
  createTimeStampsTrigger,
  utilsPath,
};
