import type { Job, JobsOptions, Queue } from 'bullmq';
import { JOB_ERROR_500_MAIL, JOB_FLUSH_LOGS } from '@repo/common-lib/constants/queues';
import { LOG_SERVICES } from '@repo/common-lib/constants/log';
import type { JobLogContext, LogChannel, LogServiceType } from '@repo/common-lib/types/log';
import type { LogService } from '../services/log-service/log.service';
import type { LogContext, LogObjectEntry, LogOverrides, Resolvable } from '../services/log-service/types';
import { logService, type LogEntry } from '../config/logging';
import { maskEmailAddresses } from '../services/log-service/helpers/redact';

/**
 * Carries the trace id from whoever enqueues a job to whoever runs it, api or worker. It travels
 * in `opts.telemetry.metadata`, BullMQ's own propagation field (persisted as `tm`, read back by
 * `Job.optsFromJSON`, ignored while no telemetry provider is configured), so `job.data` never
 * changes shape and old processes ignore it.
 *
 * There is no ambient context: the id comes from the caller's log config (`log.id`).
 */
const CARRIER_VERSION = 1;
const TRACE_ID_MAX_LENGTH = 128;
const ERROR_MESSAGE_MAX_LENGTH = 300;

/** Jobs that must never write through LogService when enqueued (alert recursion, flush noise). */
const SILENT_ENQUEUE_JOBS = new Set<string>([JOB_ERROR_500_MAIL, JOB_FLUSH_LOGS]);

/** BullMQ control-flow errors: the job is re-scheduled, not failed. */
const DEFERRAL_ERRORS = new Set(['RateLimitError', 'DelayedError', 'WaitingChildrenError', 'WaitingError']);

const errorName = (error: unknown): string =>
    error instanceof Error ? error.name : typeof error;
const errorMessage = (error: unknown): string =>
    (error instanceof Error ? error.message : String(error)).slice(0, ERROR_MESSAGE_MAX_LENGTH);

/** `opts` with the trace id attached. Never overrides an explicit `telemetry`. */
export function withJobTrace(opts: JobsOptions | undefined, id: string | null | undefined): JobsOptions {
    if (opts?.telemetry || !id) return opts ?? {};
    return { ...(opts ?? {}), telemetry: { metadata: JSON.stringify({ v: CARRIER_VERSION, id }) } };
}

/** The trace of `job`, validated. Never throws; anything malformed gives `null`. */
export function readJobTrace(job: Pick<Job, 'opts'> | undefined | null): { id: string | null } | null {
    try {
        const raw = job?.opts?.telemetry?.metadata;
        if (typeof raw !== 'string') return null;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        const { v, id } = parsed as { v?: unknown; id?: unknown };
        if (v !== CARRIER_VERSION) return null;
        if (id !== null && (typeof id !== 'string' || id.length > TRACE_ID_MAX_LENGTH)) return null;
        return { id: (id as string | null) ?? null };
    } catch {
        return null;
    }
}

/** The job's trace id (whoever enqueued it), or `null`. The worker's `workerLogger` / `workerTraceCarrier` use it as the line's `id`. */
export function jobTraceId(job: Pick<Job, 'opts'> | undefined | null): string | null {
    return readJobTrace(job)?.id ?? null;
}

/**
 * What a caller hands to `QueueHelper.*` / `enqueueJob(s)` / `runJobWithLogs` /
 * `logPermanentJobFailure` so the job's lines and the next jobs carry its service, trace id and
 * request context. Only these three are read: a carrier can never inject `defaultOptions`,
 * `format` or a `callback`. The api builds it with `requestService.traceCarrier()`, the worker
 * with `workerTraceCarrier(job)`, the dbcli with `dbcliTraceCarrier()`.
 */
export type LogTraceCarrier = {
    service?: Resolvable<string>;
    id?: Resolvable<string | null>;
    globalContext?: (logContext: LogContext) => LogObjectEntry | undefined;
};

/**
 * `log` with the job's trace id when the job has one, else `log`'s own id. Pass it on to the
 * job's enqueues (`QueueHelper.*(…, workerTraceCarrier(job))`).
 */
export function jobLogConfig(job: Pick<Job, 'opts'> | undefined | null, log: LogTraceCarrier = {}): LogTraceCarrier {
    const id = jobTraceId(job);
    return id ? { ...log, id } : log;
}

type AnyLogger = LogService<any, LogEntry>;

/**
 * Each service's factory, typed loosely: the carrier was built by that same service's helper.
 * Read when a logger is built, not at import: `config/logging` and this module import each other.
 */
const serviceFactory = (service: LogServiceType): ((overrides: LogOverrides<any>) => AnyLogger) =>
    logService[service];

/** The carrier's service, resolved. A throwing function gives `undefined`: the line is never lost. */
function carrierService(carrier: LogTraceCarrier): string | undefined {
    try {
        return typeof carrier.service === 'function' ? carrier.service() : carrier.service;
    } catch {
        return undefined;
    }
}

/**
 * A logger for the caller's carrier: its service's factory when the service is one of
 * `LOG_SERVICES`, else the process service's (`lib`). Reads only `service`, `id` and
 * `globalContext`, never the rest of the carrier.
 */
function loggerFor(carrier: LogTraceCarrier, channel: LogChannel): AnyLogger {
    const service = carrierService(carrier);
    const defaultOptions = { channel };
    if (service && (LOG_SERVICES as readonly string[]).includes(service)) {
        return serviceFactory(service as LogServiceType)({
            id: carrier.id,
            globalContext: carrier.globalContext,
            defaultOptions,
        });
    }
    return logService.lib({ id: carrier.id, defaultOptions });
}

type EnqueueOptions = JobsOptions & { deduplication?: { id: string } };

/**
 * `queue.add` with the trace id of `log` attached, plus one "Job enqueued" line written with
 * `log` (the caller's config: service, id). Same name, data and opts.
 */
export async function enqueueJob<T = unknown>(
    queue: Queue,
    name: string,
    data: T,
    opts?: JobsOptions,
    log: LogTraceCarrier = {},
): Promise<Job> {
    const silent = SILENT_ENQUEUE_JOBS.has(name);
    const queueLog = loggerFor(log, 'queue');
    const extra = { queue: queue.name, job_name: name };
    try {
        const job = await queue.add(name, data, withJobTrace(opts, queueLog.id));
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
                    ...extra,
                    job_id: job?.id ?? undefined,
                    ...(traced?.delay ? { delay_ms: traced.delay } : {}),
                    ...(traced?.deduplication?.id ? { deduplication_id: traced.deduplication.id } : {}),
                    operation: 'enqueue',
                },
            );
        }
        return job;
    } catch (error) {
        if (!silent) {
            queueLog.error('Job enqueue failed', { ...extra, error_message: errorMessage(error), operation: 'enqueue' });
        }
        throw error;
    }
}

/** `queue.addBulk` with the trace id of `log` on every job, plus ONE "Jobs enqueued" summary line. */
export async function enqueueJobs(
    queue: Queue,
    jobs: { name: string; data: unknown; opts?: JobsOptions }[],
    log: LogTraceCarrier = {},
): Promise<Job[]> {
    const queueLog = loggerFor(log, 'queue');
    const extra = { queue: queue.name, job_names: [...new Set(jobs.map((job) => job.name))], count: jobs.length };
    try {
        const id = queueLog.id;
        const added = await queue.addBulk(jobs.map((job) => ({ ...job, opts: withJobTrace(job.opts, id) })));
        queueLog.info('Jobs enqueued', { ...extra, operation: 'enqueue' });
        return added;
    } catch (error) {
        queueLog.error('Job enqueue failed', { ...extra, error_message: errorMessage(error), operation: 'enqueue' });
        throw error;
    }
}

type RunnableJob = Pick<Job, 'id' | 'name' | 'opts' | 'attemptsMade'> & { queueName?: string };

/** Whether the attempt running now is the job's last one (`attempts` defaults to 1). */
export function isFinalAttempt(job: Pick<Job, 'attemptsMade' | 'opts'>): boolean {
    return (job.attemptsMade ?? 0) + 1 >= Math.max(1, job.opts?.attempts ?? 1);
}

/**
 * The job's request context, from an allow-list: never `job.data`, whose payload can hold
 * passwords, tokens or emails. The trace id is the line's `id`, not repeated here.
 *
 * `attempt` is the one running: `attemptsMade + 1` while the job runs. BullMQ counts a failed
 * attempt into `attemptsMade` before it fires `failed`, so a line about a finished job passes
 * `{ finished: true }` and `attempt` is `attemptsMade` itself.
 */
export function jobLogContext(job: RunnableJob, { finished = false }: { finished?: boolean } = {}): JobLogContext {
    const made = job.attemptsMade ?? 0;
    return {
        queue: job.queueName ?? 'unknown',
        job_name: job.name,
        job_id: job.id !== undefined && job.id !== null ? String(job.id) : null,
        attempt: finished ? Math.max(1, made) : made + 1,
        max_attempts: Math.max(1, job.opts?.attempts ?? 1),
    };
}

function jobFields(job: RunnableJob, attempt: number) {
    return {
        queue: job.queueName ?? 'unknown',
        job_name: job.name,
        job_id: job.id !== undefined && job.id !== null ? String(job.id) : undefined,
        attempt,
    };
}

/**
 * Runs one job with start/completed/retry lines on `queue`, written with `log` plus the job's
 * trace id. The final failure belongs to `logPermanentJobFailure` (the `failed` event), so it
 * writes nothing here. Never flushes: the worker's scheduled job writes the lines.
 */
export async function runJobWithLogs<T>(
    job: RunnableJob,
    fn: () => Promise<T> | T,
    { lifecycle = true, log = {} }: { lifecycle?: boolean; log?: LogTraceCarrier } = {},
): Promise<T> {
    const queueLog = loggerFor(jobLogConfig(job, log), 'queue');
    const attempt = (job.attemptsMade ?? 0) + 1;
    const isFinal = isFinalAttempt(job);
    const fields = jobFields(job, attempt);
    const startedAt = Date.now();
    if (lifecycle) queueLog.info('Job started', { ...fields, operation: 'job' });
    try {
        const result = await fn();
        if (lifecycle) queueLog.info('Job completed', { ...fields, duration_ms: Date.now() - startedAt, operation: 'job' });
        return result;
    } catch (error) {
        if (lifecycle) {
            const name = errorName(error);
            if (DEFERRAL_ERRORS.has(name)) {
                queueLog.info('Job deferred', { ...fields, reason: name, operation: 'job' });
            } else if (!isFinal && name !== 'UnrecoverableError') {
                queueLog.warn('Job attempt failed', {
                    ...fields,
                    duration_ms: Date.now() - startedAt,
                    error_name: name,
                    error_message: errorMessage(error),
                    will_retry: true,
                    operation: 'job',
                });
            }
        }
        throw error;
    }
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
 * `UnrecoverableError` (which skips the remaining attempts and used to be silent). Written with
 * `log` plus the job's trace id.
 */
export async function logPermanentJobFailure(
    job: FailedJob | undefined,
    error: Error,
    prev?: string,
    log: LogTraceCarrier = {},
): Promise<void> {
    // The `failed` event fires after BullMQ counted the failed attempt, so a worker carrier's
    // context (built as the job runs, `attemptsMade + 1`) is rebuilt for the finished job.
    const carrier = jobLogConfig(job, log);
    const failedJobLog = loggerFor(
        job && carrierService(carrier) === 'worker'
            ? { ...carrier, globalContext: () => jobLogContext(job, { finished: true }) }
            : carrier,
        'failed-job',
    );
    if (!job) {
        failedJobLog.error('Queue worker failed with no job', {
            message: maskText(error?.message),
            stack: maskText(error?.stack),
            prev,
        });
        return;
    }

    const maxAttempts = Math.max(1, job.opts?.attempts ?? 1);
    const unrecoverable = error?.name === 'UnrecoverableError';
    if (job.attemptsMade < maxAttempts && !unrecoverable) return;

    const queueLabel = job.queueQualifiedName?.replace(/^[^:]+:/, '') ?? job.queueName ?? 'unknown';
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
}
