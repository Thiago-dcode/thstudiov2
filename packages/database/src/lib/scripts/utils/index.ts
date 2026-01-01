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

const handleMigration = async (
  callback: (migration: any, migrationName: string) => Promise<void>,
  rollback: boolean = false,
) => {
  try {
    const migrationDirectory = databaseCliConfig.migrationsDirectory;
    if (!fs.existsSync(migrationDirectory)) {
      fs.mkdirSync(migrationDirectory, { recursive: true });
    }
    // If rollback is true, we need to get the migrations from the database order by the last created at
    let migrations = !rollback
      ? fs.readdirSync(migrationDirectory)
      : (
          await Query.table('migrations')
            .select('name')
            .orderBy('created_at', 'DESC')
            .get()
        ).map((migration: any) => migration.name);

    if (migrations.length === 0) {
      Logger.info(
        `No ${!rollback ? 'migrations' : 'migrations to rollback'} found`,
      );
      process.exit(0);
    }

    // Sort migrations by the number after the dash
    if (!rollback) {
      migrations = migrations.sort((a: string, b: string) => {
        const getMigrationNumber = (filename: string): number => {
          const match = filename.match(/^(\d+)-/);
          if (!match) {
            throw new Error(
              `❌ Malformed migration name: "${filename}". Migration names must start with a number followed by a dash (e.g., "1-create_table.ts")`,
            );
          }
          return parseInt(match[1] as string, 10);
        };
        const numA = getMigrationNumber(a);
        const numB = getMigrationNumber(b);
        return numA - numB;
      });
    }

    for (const migration of migrations) {
      const migrationPath = path.join(migrationDirectory, migration);
      if (!fs.existsSync(migrationPath)) {
        Logger.error('❌ Migration file not found', migrationPath);
        process.exit(1);
      }
      const migrationFile = await import(pathToFileURL(migrationPath).href);
      if (!migrationFile.up || !migrationFile.down) {
        Logger.error(
          '❌ Migration file is not valid, missing up or down function',
          migrationPath,
        );
        process.exit(1);
      }
      await callback(migrationFile, migration);
    }
  } catch (error) {
    Logger.error('❌ Migration failed:', error);
    process.exit(1);
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
