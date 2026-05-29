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

  // Slugify the user-provided name so the filename is filesystem-safe.
  // (We also keep it stable across retries.)
  const slug = migrationName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const safeSlug = slug || 'migration';

  // Use a full timestamp (down to ms) for incremental uniqueness:
  // yyyy-mm-dd-hh-mm-ss-ms-migrationName.ts
  // If we hit a collision (extremely unlikely), we retry by shifting ms by `tries`.
  const now = new Date(Date.now() + tries);
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');

  const timestampPrefix = `${yyyy}-${mm}-${dd}-${hh}-${min}-${ss}-${ms}`;

  const migrationFilePath = path.join(
    migrationDirectory,
    `${timestampPrefix}-${safeSlug}.ts`,
  );
  if (fs.existsSync(migrationFilePath)) {
    Logger.info(
      'Migration file already exists, trying again...',
      migrationFilePath,
    );
    return getMigrationFilePathRec(migrationName, tries + 1);
  }
  return migrationFilePath;
};
