import path from 'node:path';
import fs from 'node:fs';
import Logger from '@repo/backend-lib/utils/console';
import { databaseCliConfig } from './utils/config';
import { utilsPath } from './utils';

export const createMigration = async (
  migrationName: string,
) => {
  try {
    if (!migrationName) {
      Logger.error('Please provide a migration file name');
      process.exit(1);
    }
    // Read the template file
    const templatePath = utilsPath('migration_template.ts');
    const templateExists = fs.existsSync(templatePath);
    if (!templateExists) {
      Logger.error('Template file does not exist', templatePath);
      process.exit(1);
    }

    const migrationFilePath = getMigrationFilePathRec(migrationName);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync(migrationFilePath, templateContent);

    Logger.success('Migration file created', migrationFilePath);
    process.exit(0);
  } catch (error) {
    Logger.error('Error creating migration:', error);
    process.exit(1);
  }
};
const getMigrationFilePathRec = (migrationName: string, tries = 1) => {
  const migrationDirectory = databaseCliConfig.migrationsDirectory;
  if (!fs.existsSync(migrationDirectory)) {
    fs.mkdirSync(migrationDirectory, { recursive: true });
  }
  const numMigrationFiles = fs
    .readdirSync(migrationDirectory)
    .filter((file) => file.endsWith('.ts')).length;
  const migrationFilePath = path.join(
    migrationDirectory,
    `${numMigrationFiles}-${migrationName}-${new Date().toISOString().split('T')[0]}.ts`,
  );
  if (fs.existsSync(migrationFilePath)) {
    Logger.info(
      'Migration file already exists, trying again...',
      migrationFilePath,
    );
    return getMigrationFilePathRec(migrationName + '_' + tries, tries + 1);
  }
  return migrationFilePath;
};
