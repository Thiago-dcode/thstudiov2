import { RequestLogContext } from "@repo/common-lib/types/request";
import { LogChannel } from "./channels";

export type LogFormat = 'json' | 'string';
export const DEFAULT_LOG_FORMAT: LogFormat = 'json';
export type LogConfig = {
    logFolder?: string;
    channel: LogChannel;
    /** Output format of each log line. Defaults to `json`. */
    format?: LogFormat;
    /** Written as the line's `operation`. */
    name?: string;
    id?: string | (() => string | null);
    /**
     * The request this line belongs to. Pass the function form (`RequestService.logBinding()`)
     * on shared loggers so each call reads the current request; `null` omits the `request` key.
     */
    request?: RequestLogContext | null | (() => RequestLogContext | null);
}
export type LogServiceDriver = 'console' | 'file';
export type LogOptions = { [key: string]: any };
export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'success' | 'critical';

/**
 * Stable pivot ids that follow one action across request, Stripe, webhook, queue and worker.
 * Emitted in THIS key order (`LOG_CORRELATION_KEYS`); absent or null keys are omitted.
 * Ids only: never emails, tokens, URLs or whole objects.
 */
export type LogCorrelation = {
    /** The SUBJECT user of the action (`request.user_id` is the ACTOR). */
    user_id?: number;
    job_id?: string;
    job_name?: string;
    queue?: string;
    /** 1-based attempt of the current job. */
    attempt?: number;
    /** The job that enqueued this job. */
    parent_job_id?: string;
    /** `runCronExclusive` name of the run that caused this. */
    cron?: string;
    media_id?: number;
    stripe_event_id?: string;
    stripe_event_type?: string;
    /** Stripe API `req_…` of our call, which equals `event.request.id` of the webhook it caused. */
    stripe_request_id?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_checkout_session_id?: string;
    stripe_invoice_id?: string;
};

export const LOG_CORRELATION_KEYS: readonly (keyof LogCorrelation)[] = [
    'user_id',
    'job_id',
    'job_name',
    'queue',
    'attempt',
    'parent_job_id',
    'cron',
    'media_id',
    'stripe_event_id',
    'stripe_event_type',
    'stripe_request_id',
    'stripe_customer_id',
    'stripe_subscription_id',
    'stripe_checkout_session_id',
    'stripe_invoice_id',
];

/**
 * Per-call fields. Passed as the third argument of a level method, so it is safe on a shared
 * logger instance (unlike `.name()`). Only these keys can reach the top level of a line.
 */
export type LogLineFields = {
    status_code?: number;
    /** Overrides the config `name` for this line only. */
    operation?: string;
    /** Merged over the log context's correlation; these keys win. */
    correlation?: LogCorrelation;
};

/**
 * One log line before serialisation. Key order is the JSON key order. `status_code`, `status`,
 * `correlation`, `request` and `extraInfo` are omitted when absent, never `null`.
 */
export type StatusClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

export type LogEntry = {
    timestamp: string;
    service: string;
    replica: string;
    channel: LogChannel;
    operation: string | null;
    level: Uppercase<LogLevel>;
    id: string | null;
    message: string;
    status_code?: number;
    /** Status class (`'4xx'`), derived from `status_code`; never passed by callers. Bounded: a safe label. */
    status?: StatusClass;
    correlation?: LogCorrelation;
    request?: RequestLogContext;
    extraInfo?: unknown;
};

/**
 * The process-wide handler for `critical` lines (the admin alert mail). It receives the same
 * redacted entry that is written to disk.
 */
export type CriticalLogHandler = (entry: LogEntry) => Promise<void>;