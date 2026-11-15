import type { Job, JobsOptions, Queue } from 'bullmq';
import { JOB_ERROR_500_MAIL, JOB_FLUSH_LOGS } from '@repo/common-lib/constants/queues';
import { FactoryLogService } from '../services/log-service/factory-log.service';
import { LogService } from '../services/log-service/log.service';
import {
    currentJobAttempt,
    getLogContext,
    normalizeCorrelation,
    runWithLogContext,
} from '../services/log-service/log-context';
import type { LogCorrelation } from '../services/log-service/types';
import { maskEmailAddresses } from '../services/log-service/redact';

/**
 * Carries the trace (request id + stable correlation) from whoever enqueues a job to whoever runs
 * it, api or worker. It travels in `opts.telemetry.metadata`, BullMQ's own propagation field
 * (persisted as `tm`, read back by `Job.optsFromJSON`, ignored while no telemetry provider is
 * configured), so `job.data` never changes shape and old processes ignore it.
 */
const CARRIER_VERSION = 1;
const CARRIER_MAX_LENGTH = 2048;
const TRACE_ID_MAX_LENGTH = 128;
const ERROR_MESSAGE_MAX_LENGTH = 300;

/** Job-scoped keys: they describe the current job, so the child gets its own. */
const JOB_SCOPED_KEYS: (keyof LogCorrelation)[] = ['job_id', 'job_name', 'queue', 'attempt'];

/** Jobs that must never write through LogService when enqueued (alert recursion, flush noise). */
const SILENT_ENQUEUE_JOBS = new Set<string>([JOB_ERROR_500_MAIL, JOB_FLUSH_LOGS]);

/** BullMQ control-flow errors: the job is re-scheduled, not failed. */
const DEFERRAL_ERRORS = new Set(['RateLimitError', 'DelayedError', 'WaitingChildrenError', 'WaitingError']);

const queueLog = FactoryLogService.createLogService('file', { channel: 'queue' });
const failedJobLog = FactoryLogService.createLogService('file', { channel: 'failed-job' });

const errorName = (error: unknown): string =>
    error instanceof Error ? error.name : typeof error;
const errorMessage = (error: unknown): string =>
    (error instanceof Error ? error.message : String(error)).slice(0, ERROR_MESSAGE_MAX_LENGTH);

function buildCarrier(): string | null {
    const context = getLogContext();
    if (!context) return null;
    const correlation: Record<string, unknown> = { ...context.correlation };
    for (const key of JOB_SCOPED_KEYS) delete correlation[key];
    if (context.correlation.job_id) correlation.parent_job_id = context.correlation.job_id;
    const c = normalizeCorrelation(correlation);
    const full = JSON.stringify({ v: CARRIER_VERSION, id: context.id, c });
    return full.length <= CARRIER_MAX_LENGTH ? full : JSON.stringify({ v: CARRIER_VERSION, id: context.id });
}

/** `opts` with the trace carrier when a log context exists. Never overrides an explicit `telemetry`. */
export function withJobTrace(opts?: JobsOptions): JobsOptions {
    if (opts?.telemetry) return opts;
    const metadata = buildCarrier();
    if (metadata === null) return opts ?? {};
    return { ...(opts ?? {}), telemetry: { ...(opts?.telemetry ?? {}), metadata } };
}

/** The carrier of `job`, validated. Never throws; anything malformed gives `null`. */
export function readJobTrace(job: Pick<Job, 'opts'> | undefined | null): { id: string | null; correlation: LogCorrelation } | null {
    try {
        const raw = job?.opts?.telemetry?.metadata;
        if (typeof raw !== 'string') return null;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        const { v, id, c } = parsed as { v?: unknown; id?: unknown; c?: unknown };
        if (v !== CARRIER_VERSION) return null;
        if (id !== null && (typeof id !== 'string' || id.length > TRACE_ID_MAX_LENGTH)) return null;
        return { id: (id as string | null) ?? null, correlation: normalizeCorrelation(c) };
    } catch {
        return null;
    }
}

type EnqueueOptions = JobsOptions & { deduplication?: { id: string } };

/** `queue.add` with the trace attached, plus one "Job enqueued" line. Same name, data and opts. */
export async function enqueueJob<T = unknown>(
    queue: Queue,
    name: string,
    data: T,
    opts?: JobsOptions,
): Promise<Job> {
    const silent = SILENT_ENQUEUE_JOBS.has(name);
    try {
        const job = await queue.add(name, data, withJobTrace(opts));
        if (!silent) {
            const traced = opts as EnqueueOptions | undefined;
            // When deduplication absorbs the add, BullMQ returns the job already waiting under the
            // deduplication id (with a fresh timestamp), so only the id tells: it is not the jobId
            // we asked for. Without an explicit jobId there is nothing to compare, so "enqueued".
            const deduplicated =
                !!traced?.deduplication?.id &&
                traced.jobId !== undefined &&
                job?.id !== undefined &&
                String(job.id) !== String(traced.jobId);
            queueLog.info(
                deduplicated ? 'Job deduplicated' : 'Job enqueued',
                {
                    ...(traced?.delay ? { delay_ms: traced.delay } : {}),
                    ...(traced?.deduplication?.id ? { deduplication_id: traced.deduplication.id } : {}),
                },
                { operation: 'enqueue', correlation: { queue: queue.name, job_name: name, job_id: job?.id ?? undefined } },
            );
        }
        return job;
    } catch (error) {
        if (!silent) {
            queueLog.error(
                'Job enqueue failed',
                { error_message: errorMessage(error) },
                { operation: 'enqueue', correlation: { queue: queue.name, job_name: name } },
            );
        }
        throw error;
    }
}

/** `queue.addBulk` with the trace on every job, plus ONE "Jobs enqueued" summary line. */
export async function enqueueJobs(
    queue: Queue,
    jobs: { name: string; data: unknown; opts?: JobsOptions }[],
): Promise<Job[]> {
    try {
        const added = await queue.addBulk(jobs.map((job) => ({ ...job, opts: withJobTrace(job.opts) })));
        queueLog.info(
            'Jobs enqueued',
            { job_names: [...new Set(jobs.map((job) => job.name))], count: jobs.length },
            { operation: 'enqueue', correlation: { queue: queue.name } },
        );
        return added;
    } catch (error) {
        queueLog.error(
            'Job enqueue failed',
            { job_names: [...new Set(jobs.map((job) => job.name))], count: jobs.length, error_message: errorMessage(error) },
            { operation: 'enqueue', correlation: { queue: queue.name } },
        );
        throw error;
    }
}

type RunnableJob = Pick<Job, 'id' | 'name' | 'opts' | 'attemptsMade'> & { queueName?: string };

function jobContext(job: RunnableJob | undefined, attemptOffset: number) {
    const trace = readJobTrace(job);
    const attempt = (job?.attemptsMade ?? 0) + attemptOffset;
    const maxAttempts = Math.max(1, job?.opts?.attempts ?? 1);
    return {
        id: trace?.id ?? null,
        correlation: {
            ...(trace?.correlation ?? {}),
            job_id: job?.id !== undefined && job?.id !== null ? String(job.id) : undefined,
            job_name: job?.name,
            queue: job?.queueName ?? 'unknown',
            attempt,
        },
        job: { attempt, max_attempts: maxAttempts },
    };
}

/**
 * Runs one job inside its trace context, with start/completed/retry lines on `queue`. The final
 * failure belongs to `logPermanentJobFailure` (the `failed` event), so it writes nothing here.
 * Flushes in process: a queued flush can be consumed by another replica.
 */
export async function runJobWithLogContext<T>(
    job: RunnableJob,
    fn: () => Promise<T> | T,
    { lifecycle = true }: { lifecycle?: boolean } = {},
): Promise<T> {
    return runWithLogContext(jobContext(job, 1), async () => {
        const startedAt = Date.now();
        if (lifecycle) queueLog.info('Job started', undefined, { operation: 'job' });
        try {
            const result = await fn();
            if (lifecycle) queueLog.info('Job completed', { duration_ms: Date.now() - startedAt }, { operation: 'job' });
            return result;
        } catch (error) {
            if (lifecycle) {
                const name = errorName(error);
                if (DEFERRAL_ERRORS.has(name)) {
                    queueLog.info('Job deferred', { reason: name }, { operation: 'job' });
                } else if (!currentJobAttempt()?.is_final && name !== 'UnrecoverableError') {
                    queueLog.warn(
                        'Job attempt failed',
                        {
                            duration_ms: Date.now() - startedAt,
                            error_name: name,
                            error_message: errorMessage(error),
                            will_retry: true,
                        },
                        { operation: 'job' },
                    );
                }
            }
            throw error;
        } finally {
            await LogService.flush().catch((flushError) => console.error('Failed to flush job logs:', flushError));
        }
    });
}

/** Email bodies carry live recovery and 2FA codes: log their size, never their content. */
const BODY_KEYS = new Set(['html', 'text']);
/** Mail envelope fields: recipients and subjects are PII on disk and in Loki. */
const ENVELOPE_KEYS = new Set(['to', 'from', 'cc', 'bcc', 'replyto', 'subject']);

/**
 * The loggable copy of a job's data. Bodies become their size, envelope fields are redacted, and
 * any address-shaped text elsewhere (a user row's email, a quoted recipient) is masked.
 */
export const redactJobData = (data: unknown): unknown => {
    if (typeof data === 'string') return maskEmailAddresses(data);
    if (Array.isArray(data)) return data.map(redactJobData);
    if (!data || typeof data !== 'object') return data;
    return Object.fromEntries(
        Object.entries(data as Record<string, unknown>).map(([key, value]) => {
            if (BODY_KEYS.has(key) && typeof value === 'string') {
                return [key, `[redacted, ${value.length} chars]`];
            }
            if (ENVELOPE_KEYS.has(key.toLowerCase().replace(/[_-]/g, ''))) return [key, '[redacted]'];
            return [key, redactJobData(value)];
        }),
    );
};

/** BullMQ failure text quotes whatever the error said, recipients included. */
const maskText = (value: unknown): unknown => (typeof value === 'string' ? maskEmailAddresses(value) : value);

type FailedJob = RunnableJob & Pick<Job, 'data' | 'failedReason' | 'stacktrace'> & { queueQualifiedName?: string };

/**
 * The `failed` event handler: one `failed-job` error once a job has no attempts left, or threw
 * `UnrecoverableError` (which skips the remaining attempts and used to be silent).
 */
export async function logPermanentJobFailure(job: FailedJob | undefined, error: Error, prev?: string): Promise<void> {
    if (!job) {
        failedJobLog.error('Queue worker failed with no job', {
            message: maskText(error?.message),
            stack: maskText(error?.stack),
            prev,
        });
        await LogService.flush().catch((flushError) => console.error('Failed to flush job logs:', flushError));
        return;
    }

    const maxAttempts = Math.max(1, job.opts?.attempts ?? 1);
    const unrecoverable = error?.name === 'UnrecoverableError';
    if (job.attemptsMade < maxAttempts && !unrecoverable) return;

    const queueLabel = job.queueQualifiedName?.replace(/^[^:]+:/, '') ?? job.queueName ?? 'unknown';
    // attemptsMade is already counted for the failed attempt, so the context attempt is attemptsMade.
    await runWithLogContext(jobContext({ ...job, queueName: job.queueName ?? queueLabel }, 0), async () => {
        failedJobLog.error('Job failed permanently', {
            queue: queueLabel,
            queueQualifiedName: job.queueQualifiedName,
            jobId: job.id,
            jobName: job.name,
            data: redactJobData(job.data),
            attemptsMade: job.attemptsMade,
            maxAttempts,
            failedReason: maskText(job.failedReason ?? error?.message),
            errorMessage: maskText(error?.message),
            errorStack: maskText(error?.stack),
            stacktrace: Array.isArray(job.stacktrace) ? job.stacktrace.map(maskText) : job.stacktrace,
            prev,
            will_retry: false,
        });
        await LogService.flush().catch((flushError) => console.error('Failed to flush job logs:', flushError));
    });
}
