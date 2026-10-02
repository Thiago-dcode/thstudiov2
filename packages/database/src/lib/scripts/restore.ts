import { restore as restoreBackup } from '@repo/backend-lib/services/backup-service';
import Logger from '@repo/backend-lib/utils/console';
import { APP_SECRET_ENV, verifyAppSecret } from './utils/destructive-password';

export type RestoreOptions = {
  date: string;
  password: string;
  allowProduction?: boolean;
  exitProcess?: boolean;
};

/** Restores the S3 backup taken on `date` (YYYY-MM-DD). Re-checks `APP_SECRET` itself rather than trusting the CLI. */
const restoreDatabase = async (options: RestoreOptions) => {
  const shouldExit = options.exitProcess !== false;
  const start = Date.now();
  try {
    if (!verifyAppSecret(options.password)) {
      throw new Error(`Invalid password (check ${APP_SECRET_ENV}). Refusing restore.`);
    }

    Logger.info(`🔄 Restoring backup from ${options.date}...`);
    const { key } = await restoreBackup({
      date: options.date,
      allowProduction: Boolean(options.allowProduction),
    });

    Logger.success(`✅ Restored ${key} in ${((Date.now() - start) / 1000).toFixed(2)}s`);
    if (shouldExit) process.exit(0);
  } catch (error) {
    Logger.error('❌ Restore failed:', error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};

export { restoreDatabase };
