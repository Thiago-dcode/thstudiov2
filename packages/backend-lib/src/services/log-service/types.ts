
export type LogFormat = 'json' | 'logfmt';
export const DEFAULT_LOG_FORMAT: LogFormat = 'json';
export type LogOptions = { [key: string]: any };
export type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'success' | 'critical';
export type LogObjectEntry = Record<string, any>;
/** The minimum every built entry has: what `entryBuilder` produces, whatever extra fields `E` adds. */
export type LogEntryBase = LogObjectEntry & {
    timestamp: string;
    level: string;
    service: string;
    message: string;
    format: LogFormat;
    id?: string | null;
    options?: LogObjectEntry;
    globalContext?: LogObjectEntry;
};
/** A value, or a function that returns it. Called on every line. */
export type Resolvable<T> = T | (() => T);
export type LogContext = {
    timestamp: Date,
    level: LogLevel,
    service: string,
    message: string,
    format: LogFormat,
    /** The resolved trace id: `log()` reads the config's `id` once per line. */
    id: string | null,
    logOptions?: LogOptions
}
/** Called with every line as soon as it is logged. Never awaited, never waits for a flush. */
export type LogCallback<T extends LogObjectEntry = {}> = (logContext: LogContext, globalContext: T) => Promise<void>;

/** `undefined` when there is none (outside a request). */
export type globalContext<T> = (context: LogContext) => T | undefined

export type LogConfig<T extends LogObjectEntry = {}> = {
    /**
     * The service, and the folder: the file driver writes `<folder>/<service>/<date>.log`. Pass a
     * function when it is only known later; each line reads the current value.
     */
    service?: Resolvable<string>;
    /**
     * Options every line of this logger starts from; a call's own options win. How a caller
     * pre-binds fields (a channel, say) without the LogService knowing what they mean.
     */
    defaultOptions?: LogOptions;
    /** Output format of each line. Defaults to `json`. Fixed once the logger is built. */
    readonly format?: LogFormat;
    /** The trace id. Pass a function on shared loggers so each line reads the current one. */
    id?: Resolvable<string | null>;
    globalContext?: globalContext<T>;
    callback?: LogCallback<T>;
};

/** What a logger factory takes: everything but the service, which is the factory's. */
export type LogOverrides<T extends LogObjectEntry = {}> = Omit<LogConfig<T>, 'service'>;

export type PruneDailyLogFilesResult = {
    deleted: string[];
    /** Files that vanished between the `readdir` and the `unlink` - see the ENOENT note in `pruneDailyLogFiles`. */
    alreadyGone: string[];
    skipped: string[];
    failed: { file: string; error: string }[];
    /** Subdirectories left empty by the prune (deepest first). `logRoot` itself is never removed. */
    removedDirs: string[];
};
