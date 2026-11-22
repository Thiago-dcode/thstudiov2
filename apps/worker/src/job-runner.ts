import {
    BACKUP_QUEUE,
    JOB_DATABASE_BACKUP,
    JOB_DELETE_REPLACED_MEDIA_OBJECT,
    JOB_FLUSH_LOGS,
    JOB_PROCESS_MEDIA,
    JOB_REGENERATE_MEDIA_THUMBNAIL,
    JOB_SET_VIDEO_THUMBNAIL,
    LOG_QUEUE,
    MEDIA_QUEUE,
    MEDIA_THUMBNAIL_QUEUE,
} from '@repo/common-lib/constants/queues';
import { logBuffer } from '@repo/backend-lib/config/logging';
import { runJobWithLogs } from '@repo/backend-lib/utils';
import type { Job } from 'bullmq';
import { BackupProcessor } from './processors/backup.processor';
import { workerTraceCarrier } from './logging';
import { MediaProcessor } from './processors/media.processor';

export type JobResolver = Record<string, Record<string, (job: Job) => Promise<unknown>>>;

export const jobResolver: JobResolver = {
    [MEDIA_QUEUE]: {
        [JOB_PROCESS_MEDIA]: (job) => MediaProcessor.handle(job),
    },
    [MEDIA_THUMBNAIL_QUEUE]: {
        [JOB_REGENERATE_MEDIA_THUMBNAIL]: (job) => MediaProcessor.handle(job),
        [JOB_SET_VIDEO_THUMBNAIL]: (job) => MediaProcessor.handle(job),
        [JOB_DELETE_REPLACED_MEDIA_OBJECT]: (job) => MediaProcessor.handle(job),
    },
    [BACKUP_QUEUE]: {
        [JOB_DATABASE_BACKUP]: () => BackupProcessor.handle(),
    },
    // The only flush of the shared log buffer, scheduled every 5 s (`scheduleLogFlush`).
    [LOG_QUEUE]: {
        [JOB_FLUSH_LOGS]: () => logBuffer.flush(),
    },
};

/**
 * Runs one worker job with the same start/completed/retry lines as api jobs, written under the
 * job's trace id (the id of whoever enqueued it, e.g. the upload request). The permanent failure
 * line comes from the `failed` listener in `main.ts`. The log flush writes no lifecycle lines: one
 * pair every 5 s would be pure noise.
 */
export function runWorkerJob(queueName: string, job: Job): Promise<unknown> {
    const lifecycle = queueName !== LOG_QUEUE;
    const runnable = { ...pickJob(job), queueName };
    return runJobWithLogs(runnable, () => {
        const handler = jobResolver[queueName]?.[job.name];
        if (typeof handler !== 'function') {
            throw new Error(`Job name "${job.name}" not recognized for queue "${queueName}"`);
        }
        // Returned so BullMQ stores it as the job's return value (read by `dbcli db:backup`).
        return handler(job);
    }, { lifecycle, log: workerTraceCarrier(runnable) });
}

/** The fields the lifecycle lines need; `queueName` is passed explicitly in case the job lacks it. */
const pickJob = (job: Job) => ({
    id: job.id,
    name: job.name,
    opts: job.opts,
    attemptsMade: job.attemptsMade,
});
