import path from 'node:path';
import fs from 'node:fs';
import Logger from '@repo/backend-lib/utils/console';
import { migrationConfig } from '../config';
(async () => {
  const fileName = process.argv[2];
  if (!fileName) {
    Logger.error('Please provide a migration file name');
    process.exit(1);
  }
  // Read the template file
  const templatePath = path.join(
    __dirname,
    '..',
    'utils',
    'migration_template.ts',
  );

  const templateExists = fs.existsSync(templatePath);
  if (!templateExists) {
    Logger.error('Template file does not exist', templatePath);
    process.exit(1);
  }

  const migrationDirectory = migrationConfig.migrationsDirectory;
  if (!fs.existsSync(migrationDirectory)) {
    fs.mkdirSync(migrationDirectory, { recursive: true });
  }
  const migrationFilePath = path.join(
    migrationDirectory,
    `${Date.now()}-${fileName}.ts`,
  );
  if (fs.existsSync(migrationFilePath)) {
    Logger.error('Migration file already exists', migrationFilePath);
    process.exit(1);
  }
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(migrationFilePath, templateContent);

  Logger.success('Migration file created', migrationFilePath);
  process.exit(0);
})();
