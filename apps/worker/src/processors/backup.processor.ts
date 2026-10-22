import { backup, BackupResult, deleteExpiredBackup } from '@repo/backend-lib/services/backup-service';

export class BackupProcessor {
    /**
     * Daily database backup. Both steps no-op outside production; the service logs each step.
     * Returns the backup's result as the job's return value, so `dbcli db:backup` can report it.
     */
    static async handle(): Promise<BackupResult> {
        const result = await backup();
        // Only reached when today's dump is safely stored: a failed backup throws before this.
        await deleteExpiredBackup();
        return result;
    }
}
