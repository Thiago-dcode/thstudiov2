import fs from 'node:fs';
import { databaseCliConfig } from './utils/config';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Logger from '@repo/backend-lib/utils/console';
import { connectDb } from './utils';

const seed = async (className = 'main') => {
  const start = Date.now();
  try {
    await connectDb();
    const seedDirectory = databaseCliConfig.seedDirectory;
    if (!fs.existsSync(seedDirectory)) {
      fs.mkdirSync(seedDirectory, { recursive: true });
    }
    Logger.info(`Running ${className} seed`);
    const mainSeedPath = path.join(seedDirectory, `${className}.ts`);
    if (!fs.existsSync(mainSeedPath)) {
      Logger.error('Seed file does not exist: ', mainSeedPath);
      process.exit(1);
    }
    const migrationFile = await import(pathToFileURL(mainSeedPath).href);
    if (!migrationFile.main) {
      Logger.error(
        `Seed ${className} file is not valid, missing main function: `,
        'export const main = async () => {}',
      );
      process.exit(1);
    }
    await migrationFile.main();
    Logger.success(
      `✅ Seed ${className} completed in ${((Date.now() - start) / 1000).toFixed(2)}s`,
    );
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

export { seed };
