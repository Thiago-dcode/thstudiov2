import type { BackupResult } from '@repo/backend-lib/services/backup-service';
import Logger from '@repo/backend-lib/utils/console';
import { QueueHelper } from '@repo/backend-lib/utils';

/** A dump takes seconds today; this is only the point at which a stuck or missing worker gets reported. */
const BACKUP_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Runs the daily database backup on demand (e.g. right before moving servers) and reports its outcome.
 *
 * The worker does the work: this CLI runs in the api image, which has no `pg_dump`. Same processor as the
 * scheduled run, so it also prunes expired dumps, and it no-ops outside production. The dump's key is
 * per day, so running it again the same day overwrites that day's dump.
 */
const backupDatabase = async () => {
  const start = Date.now();
  try {
    Logger.info('🔄 Queued a database backup, waiting for the worker...');
    const result = (await QueueHelper.runDatabaseBackupJob(BACKUP_TIMEOUT_MS)) as BackupResult;

    if (result.status === 'skipped') {
      Logger.warn(`⚠️  Backup skipped: ${result.reason}.`);
      process.exit(0);
    }
    Logger.success(
      `✅ Backed up to ${result.key} (${result.size} bytes) in ${((Date.now() - start) / 1000).toFixed(1)}s`,
    );
    process.exit(0);
  } catch (error) {
    Logger.error('❌ Backup failed (is the worker running? see its logs):', error);
    process.exit(1);
  }
};

export { backupDatabase };
