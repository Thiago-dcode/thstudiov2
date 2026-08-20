import path from 'node:path';
import fs from 'node:fs';
import Logger from '@repo/backend-lib/utils/console';
import { sourceSeedsDirectory } from './utils/paths';
import { utilsPath } from './utils';

export const createSeeder = async (
  seedName: string,
) => {
  try {
    if (!seedName) {
      Logger.error('Please provide a seed file name');
      process.exit(1);
    }
    // Read the template file
    const templatePath = utilsPath('seed_template.ts');
    const templateExists = fs.existsSync(templatePath);
    if (!templateExists) {
      Logger.error('Template file does not exist', templatePath);
      process.exit(1);
    }

    const seedFilePath = getSeedFilePath(seedName);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync(seedFilePath, templateContent);

    Logger.success('  Seed file created', seedFilePath);
    process.exit(0);
  } catch (error) {
    Logger.error('Error creating seed:', error);
    process.exit(1);
  }
};
const getSeedFilePath = (seedName: string) => {
  // Same split as migrations: scaffold `.ts` into source, run compiled `.js` from dist.
  const seedDirectory = sourceSeedsDirectory;
  if (!fs.existsSync(seedDirectory)) {
    fs.mkdirSync(seedDirectory, { recursive: true });
  }
const mainSeedPath = path.join(seedDirectory, 'main.ts');
  if (!fs.existsSync(mainSeedPath)) {
    fs.writeFileSync(
      mainSeedPath,
      `import { connectDb } from '../lib/scripts/utils';

export const main = async () => {
  await connectDb();
  //Your seeder code here
};
`,
    );
  }
  const seedFilePath = path.join(
    seedDirectory,
    `${seedName}.ts`,
  );
  if (fs.existsSync(seedFilePath)) {
    Logger.error(
      'Seed file already exists...',
      seedFilePath,
    );
  process.exit(0);
  }
  return seedFilePath;
};
