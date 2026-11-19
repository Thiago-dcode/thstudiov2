import { RequestLogContext } from "@repo/common-lib/types/request";
import type { LOG_CHANNELS } from "./helpers/channels";

/** One of `LOG_CHANNELS` (`helpers/channels.ts`): a closed set, so it is safe as a Loki label. */
export type LogChannel = (typeof LOG_CHANNELS)[number];

export type LogFormat = 'json' | 'string';
export const DEFAULT_LOG_FORMAT: LogFormat = 'json';
export type LogServiceType = 'web' | 'api' | 'dbcli' | 'worker';
export type LogOptions = { [key: string]: any };
export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'success' | 'critical';

/** A value, or a function that returns it. Called on every line. */
export type Resolvable<T> = T | (() => T);

/** Called with every line as soon as it is logged. Never awaited, never waits for a flush. */
export type LogCallback = (entry: LogEntry) => Promise<void>;

export type LogConfig = {
    /** The service, and the folder: the file driver writes `<folder>/<service>/<date>.log`. */
    service: LogServiceType;
    channel?: LogChannel;
    /** Output format of each line. Defaults to `json`. Fixed once the logger is built. */
    readonly format?: LogFormat;
    /** Written as the line's `operation`. */
    name?: string;
    /** The trace id. Pass a function on shared loggers so each line reads the current one. */
    id?: Resolvable<string | null>;
    /** The request the line belongs to. `null` omits the `request` key. */
    request?: Resolvable<RequestLogContext | null>;
    callback?: LogCallback;
};

/**
 * What a `LogService` is built from (by the `logService.*` factories in `config/logging.ts`): a
 * `LogConfig`, or one with `service: null`. Null is only for
 * backend-lib's own loggers (job-trace, stripe, s3, llm, paypal, ai, backup): they run in every
 * app and some are built at import, before the entrypoint calls `setLogProcessService`, so each
 * of their lines takes the process service when it is built (`unknown` if none was set). App
 * loggers spread their `logConfig.<service>`.
 *
 * Overrides and trace carriers (`enqueueJob(…, log)`, `jobLogConfig`, `apiLogConfig(config)`)
 * are `Partial<LogConfig>`: they never build a logger on their own.
 */
export type LoggerConfig = Omit<LogConfig, 'service'> & { service: LogServiceType | null };

/** What a `logService.<service>(…)` factory takes: everything but the service, which is the factory's. */
export type LogOverrides = Omit<Partial<LogConfig>, 'service'>;

/**
 * Per-call fields, the third argument of a level method. Safe on a shared logger instance
 * (unlike `.name()`).
 */
export type LogLineFields = {
    status_code?: number;
    /** Overrides the config `name` for this line only. */
    operation?: string;
};

/**
 * One log line before serialisation. Key order is the JSON key order. `status_code`, `request`
 * and `extraInfo` are omitted when absent, never `null`.
 */
export type LogEntry = {
    timestamp: string;
    service: string;
    replica: string;
    channel: LogChannel;
    operation: string | null;
    format: LogFormat;
    level: Uppercase<LogLevel>;
    id: string | null;
    message: string;
    status_code?: number;
    request?: RequestLogContext;
    extraInfo?: unknown;
};

export type PruneDailyLogFilesResult = {
    deleted: string[];
    /** Files that vanished between the `readdir` and the `unlink` - see the ENOENT note in `pruneDailyLogFiles`. */
    alreadyGone: string[];
    skipped: string[];
    failed: { file: string; error: string }[];
    /** Subdirectories left empty by the prune (deepest first). `logRoot` itself is never removed. */
    removedDirs: string[];
};
