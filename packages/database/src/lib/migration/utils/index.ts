import Logger from '@repo/backend-lib/utils/console';
import { migrationConfig } from '../config';
import path from 'node:path';
import fs from 'node:fs';
import { Schema } from '../../utils/facades';
import { TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME } from '../../utils/constants';
import { TableName } from '../../utils/types';

const handleMigration = async (
  callback: (migration: any, migrationName: string) => Promise<void>,
) => {
  const migrationDirectory = migrationConfig.migrationsDirectory;
  console.log(migrationDirectory);
  if (!fs.existsSync(migrationDirectory)) {
    fs.mkdirSync(migrationDirectory, { recursive: true });
  }
  const migrations = fs.readdirSync(migrationDirectory);
  if (migrations.length === 0) {
    Logger.info('No migrations found');
    process.exit(0);
  }
  for (const migration of migrations) {
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
    await callback(migrationFile, migration);
  }
};

const createUpdatedAtTrigger = async (tableName: TableName) => {
  await Schema.table(tableName).raw(`
    CREATE TRIGGER update_${tableName}_updated_at 
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW 
    EXECUTE FUNCTION ${TRIGGER_UPDATE_UPDATED_AT_FUNCTION_NAME}();
  `);
};

export { handleMigration, createUpdatedAtTrigger };
