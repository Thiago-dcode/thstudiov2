import { backup, deleteExpiredBackup } from '@repo/backend-lib/services/backup-service';

export class BackupProcessor {
    /** Daily database backup. Both steps no-op outside production; the service logs each step. */
    static async handle(): Promise<void> {
        await backup();
        // Only reached when today's dump is safely stored: a failed backup throws before this.
        await deleteExpiredBackup();
    }
}
