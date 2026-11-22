import { logService } from '@repo/backend-lib/config/logging';
import { type LogTraceCarrier, jobLogContext, jobTraceId } from '@repo/backend-lib/utils';
import type { LogChannel } from '@repo/common-lib/types/log';
import type { Job } from 'bullmq';

/** The worker's logger: `request` is the job's context (`JobLogContext`), `service` is `worker`. */
export type WorkerLogger = ReturnType<typeof logService.worker>;

/** The fields of a BullMQ job the log context is built from. */
export type WorkerJob = Pick<Job, 'id' | 'name' | 'opts' | 'attemptsMade'> & { queueName?: string };

/**
 * A logger for one worker job. Its lines carry the trace id of whoever enqueued the job and, as
 * `request`, the job's allow-listed context (queue, name, id, attempt), never `job.data`. The
 * context is read per line, from a closure over this job: no state is shared between jobs.
 */
export function workerLogger(
    channel: LogChannel,
    job?: WorkerJob | null,
    { operation }: { operation?: string } = {},
): WorkerLogger {
    return logService.worker({
        id: jobTraceId(job),
        ...(job ? { globalContext: () => jobLogContext(job) } : {}),
        defaultOptions: operation ? { channel, operation } : { channel },
    });
}

/**
 * The carrier a job passes to `QueueHelper.*(…, log)` / `runJobWithLogs` /
 * `logPermanentJobFailure`: the worker's service, the job's trace id and its request context.
 */
export function workerTraceCarrier(job?: WorkerJob | null): LogTraceCarrier {
    return {
        service: 'worker',
        id: jobTraceId(job),
        ...(job ? { globalContext: () => jobLogContext(job) } : {}),
    };
}
