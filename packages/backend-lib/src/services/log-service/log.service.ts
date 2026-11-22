
import {

    LogLevel,

    LogOptions,
    Resolvable,
    LogContext,

    LogObjectEntry,
    LogEntryBase,
    LogConfig,

} from "./types";
import { redactLogOptions } from "./helpers/redact";
import { LogBuffer } from "./buffers/log.buffer";

const UNKNOWN_SERVICE = 'unknown';


/** The function form called, the value form as is. A throwing function gives `null`: the line is never lost. */
function resolve<T>(value: Resolvable<T | null> | undefined, key: string): T | null {
    if (typeof value !== 'function') return value ?? null;
    try {
        return (value as () => T | null)() ?? null;
    } catch (error) {
        console.error(`LogService: resolving \`${key}\` failed`, error);
        return null;
    }
}

export class LogService<T extends LogObjectEntry, E extends LogEntryBase> {

    protected readonly config: LogConfig<T>;
    protected readonly logBuffer: LogBuffer<E>;

    constructor(
        config: LogConfig<T>,
        logBuffer: LogBuffer<E>,
        protected readonly entryBuilder: (logContext: LogContext, globalContext?: T) => E = (logContext, globalContext) => {

            const { logOptions, timestamp, ...rest } = logContext;
            const entry = {
                timestamp: timestamp.toISOString(),
                ...rest
            } as E;

            if (logOptions) {

                entry.options = redactLogOptions(logOptions);
            }
            if (globalContext) {

                entry.globalContext = redactLogOptions(globalContext);

            }
            return entry;
        }
    ) {
        // Immutable: a shallow copy, so a caller mutating its own config object later cannot
        // change a logger that is already built (and shared).
        this.config = { ...config };
        this.logBuffer = logBuffer;
    }

    /** The trace id, with the function form resolved. */
    get id(): string | null {
        return resolve(this.config.id, 'id');
    }

    /** The request, read from the config function on every line. A throwing function gives `undefined`: the line is never lost. */
    getGlobalContext(logContext: LogContext): T | undefined {
        try {
            return this.config.globalContext?.(logContext);
        } catch (error) {
            console.error('LogService: resolving `globalContext` failed', error);
            return undefined;
        }
    }

    public info(message: string, options?: LogOptions): this {
        return this.log('info', message, options);
    }

    public error(message: string, options?: LogOptions): this {
        return this.log('error', message, options);
    }

    public warn(message: string, options?: LogOptions): this {
        return this.log('warn', message, options);
    }

    public debug(message: string, options?: LogOptions): this {
        return this.log('debug', message, options);
    }

    public success(message: string, options?: LogOptions): this {
        return this.log('success', message, options);
    }

    public critical(message: string, options?: LogOptions): this {
        return this.log('critical', message, options);
    }

    /**
     * Builds the line now (timestamp, config, `id`/`request` read in the caller's request), queues
     * it in the buffer, and fires the callback right away: a callback never waits for a flush.
     */
    protected log(level: LogLevel, message: string, options?: LogOptions): this {

        const logContext: LogContext = {
            timestamp: new Date(),
            level,
            message,
            format: this.config.format ?? 'json',
            service: resolve(this.config.service, 'service') ?? UNKNOWN_SERVICE,
            id: this.id,
            logOptions: this.withDefaults(options),

        }

        // Read once: the entry and the callback must see the same request.
        const globalContext = this.getGlobalContext(logContext);
        const entry = this.entryBuilder(logContext, globalContext);

        this.logBuffer.add(logContext, entry);
        this.runCallback(logContext, globalContext);
        return this;
    }

    /** The config's `defaultOptions` under the call's options. An Error is flattened so it can merge. */
    private withDefaults(options?: LogOptions): LogOptions | undefined {
        const defaults = this.config.defaultOptions;
        if (!defaults) return options;
        if (options instanceof Error) {
            return { ...defaults, name: options.name, message: options.message, stack: options.stack };
        }
        return { ...defaults, ...options };
    }

    /** Not awaited by anyone. Tracked so `settle()` can wait for it before exit. */
    private runCallback(logContext: LogContext, globalContext: T | undefined): void {
        const callback = this.config.callback;
        if (!callback) return;
        const run = (async () => {
            try {
                await callback(logContext, globalContext as T);
            } catch (error) {
                // Never log through a LogService here: a failing callback that logged could loop.
                console.error('LogService: log callback failed', error);
            }
        })();
        this.logBuffer.track(run);
    }


}
