import Logger from '@repo/backend-lib/utils/console';
import { migrationConfig } from '../config';
import path from 'node:path';
import fs from 'node:fs';

const handleMigration = async (callback: (migration: any,migrationName: string) => Promise<void>) => {
  const migrationDirectory = migrationConfig.migrationsDirectory;
  if (!fs.existsSync(migrationDirectory)) {
    Logger.error('No migrations found');
    process.exit(1);
  }
  const migrations = fs.readdirSync(migrationDirectory);
  for (const migration of migrations) {
    Logger.info(migration);
    const migrationPath = path.join(migrationDirectory, migration);
    if (!fs.existsSync(migrationPath)) {
      Logger.error('Migration file not found', migrationPath);
      process.exit(1);
    }
    const migrationFile = require(migrationPath);
    if (!migrationFile.up || !migrationFile.down) {
      Logger.error(
        'Migration file is not valid, missing up or down function',
        migrationPath,
      );
      process.exit(1);
    }
    await callback(migrationFile,migration);
  }
};

export { handleMigration };
