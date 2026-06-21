import fs from 'node:fs';
import { databaseCliConfig } from './utils/config';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Logger from '@repo/backend-lib/utils/console';
import { connectDb } from './utils';

export type SeedOptions = { exitProcess?: boolean };

const seed = async (className = 'main', options: SeedOptions = {}) => {
  const shouldExit = options.exitProcess !== false;
  const start = Date.now();
  try {
    await connectDb();
    const seedDirectory = databaseCliConfig.seedDirectory;
    if (!fs.existsSync(seedDirectory)) {
      fs.mkdirSync(seedDirectory, { recursive: true });
    }
    Logger.info(`Running ${className} seed`);
    const mainSeedPath = path.join(seedDirectory, `${className}.js`);
    if (!fs.existsSync(mainSeedPath)) {
      Logger.error('Seed file does not exist: ', mainSeedPath);
      if (shouldExit) process.exit(1);
      throw new Error(`Seed file missing: ${mainSeedPath}`);
    }
    const migrationFile = await import(pathToFileURL(mainSeedPath).href);
    if (!migrationFile.main) {
      Logger.error(
        `Seed ${className} file is not valid, missing main function: `,
        'export const main = async () => {}',
      );
      if (shouldExit) process.exit(1);
      throw new Error(`Invalid seed file: ${className}`);
    }
    await migrationFile.main();
    Logger.success(
      `✅ Seed ${className} completed in ${((Date.now() - start) / 1000).toFixed(2)}s`,
    );
    if (shouldExit) process.exit(0);
  } catch (error) {
    Logger.error('❌ Seed failed:', error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};

export { seed };
