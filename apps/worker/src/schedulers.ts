import { config } from '@repo/common-lib/config';
import {
    BACKUP_QUEUE,
    JOB_DATABASE_BACKUP,
    JOB_FLUSH_LOGS,
    LOG_QUEUE,
} from '@repo/common-lib/constants/queues';
import { Queue } from 'bullmq';

export type Connection = { url: string };

/** How often the worker writes the shared log buffer (`logs:pending`) to `storage/logs/<service>/`. */
export const LOG_FLUSH_EVERY_MS = 5_000;

/** Runs `configure` against a short-lived handle on `queueName`, always closing it afterwards. */
export async function withQueue(connection: Connection, queueName: string, configure: (queue: Queue) => Promise<unknown>) {
    const queue = new Queue(queueName, { connection });
    try {
        await configure(queue);
    } finally {
        await queue.close();
    }
}

/**
 * upsertJobScheduler is idempotent (keyed by id, stored in Redis), so every worker instance and every
 * restart can call it without duplicating the schedule. The backup itself no-ops outside production.
 */
export const scheduleDatabaseBackup = (connection: Connection) =>
    withQueue(connection, BACKUP_QUEUE, (queue) =>
        queue.upsertJobScheduler(
            JOB_DATABASE_BACKUP,
            { pattern: config().backup.cron, tz: 'UTC' },
            {
                name: JOB_DATABASE_BACKUP,
                opts: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5 * 60 * 1000 },
                    removeOnComplete: 30,
                    removeOnFail: 30,
                },
            },
        ),
    );

/**
 * The only flush of the log buffer: every service pushes its lines to one Redis list, and this
 * job (one run per interval across all worker instances) writes them to disk. No retries: the
 * lines stay in the list on failure and the next run takes them.
 */
export const scheduleLogFlush = (connection: Connection) =>
    withQueue(connection, LOG_QUEUE, (queue) =>
        queue.upsertJobScheduler(
            JOB_FLUSH_LOGS,
            { every: LOG_FLUSH_EVERY_MS },
            {
                name: JOB_FLUSH_LOGS,
                opts: { attempts: 1, removeOnComplete: true, removeOnFail: 100 },
            },
        ),
    );
