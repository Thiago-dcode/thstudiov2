import { format } from "date-fns";
import { Queue, JobsOptions } from "bullmq";
import { JOB_FLUSH_LOGS } from "@repo/common-lib/constants/queues";
import { LogConfig, LogLevel, LogOptions, LogServiceDriver } from "./types";
import { redactLogOptions } from "./redact";

const DEFAULT_LOG_JOB_OPTIONS: JobsOptions = {
    priority: 10,
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
};

export abstract class LogService {
    protected static date: Date;
    protected static type: LogServiceDriver;
    private static pendingLogs: (() => Promise<void>)[] = [];

    protected readonly config: LogConfig;

    constructor(
        config: LogConfig,
        protected readonly queue?: Queue,
    ) {
        // Own the config. Callers pass the shared `logConfig.*` singletons, and the builder
        // methods below mutate `this.config` — so without this copy, one `.channel()` call in
        // ResponseExceptionFilter permanently rewrote the channel for every other logger built
        // from the same object, sending ordinary logs to `api/errors/500` and firing the
        // 500-alert callback on every subsequent line.
        this.config = { ...config };
    }

    /**
     * Queues a log operation for deferred execution.
     * The callback is not invoked until flush() is called.
     */
    protected static trackLog(callback: () => Promise<void>): void {
        LogService.pendingLogs.push(callback);
    }

    /**
     * Executes all queued log operations and waits for them to complete.
     * Call this before process exit to ensure all logs are written.
     */
    public static async flush(): Promise<void> {
        const batch = LogService.pendingLogs.splice(0);
        await Promise.all(batch.map(cb => cb()));
    }

    /**
     * Queues a flush job via BullMQ. No-op when there is nothing pending.
     * Prefer this from HTTP interceptors so they do not depend on whichever
     * feature-module `LogService` Nest resolved for the request.
     */
    public static async enqueueFlush(queue: Queue, jobOptions?: JobsOptions): Promise<void> {
        if (!LogService.pendingLogs.length) return;
        await queue.add(
            JOB_FLUSH_LOGS,
            {},
            {
                ...DEFAULT_LOG_JOB_OPTIONS,
                jobId: `log-flush-${Date.now()}`,
                ...jobOptions,
            },
        );
    }

    /**
     * Queues a flush job via BullMQ when this instance has a Queue.
     * Falls back to an in-process flush so logs are not dropped when a
     * feature module constructed LogService without one.
     */
    public async flushAsync(jobOptions?: JobsOptions): Promise<void> {
        if (!this.queue) {
            await LogService.flush();
            return;
        }
        await LogService.enqueueFlush(this.queue, jobOptions);
    }

    public channel(channel: string) {
        this.config.channel = channel;
        return this;
    }
    public name(name: string) {
        this.config.name = name;
        return this;
    }
    public id(id: string | (() => string | null)) {
        this.config.id = id;
        return this;
    }

    public callback(callback: LogConfig['callback']) {
        this.config.callback = callback;
        return this;
    }
    public info(message: string, options?: LogOptions): this {
        console.log(this.beautifyLogMessage('info', message, options));
        return this;
    }

    public error(message: string, options?: LogOptions): this {
        console.error(this.beautifyLogMessage('error', message, options));
        return this;
    }

    public warn(message: string, options?: LogOptions): this {
        console.warn(this.beautifyLogMessage('warn', message, options));
        return this;
    }

    public debug(message: string, options?: LogOptions): this {
        console.debug(this.beautifyLogMessage('debug', message, options));
        return this;
    }

    public success(message: string, options?: LogOptions): this {
        console.log(this.beautifyLogMessage('success', message, options));
        return this;
    }
    protected getLogId(): string | null {
        return typeof this.config.id === 'function' ? this.config.id() : (this.config.id || null);
    }

    protected beautifyLogMessage(level: LogLevel, message: string, options?: LogOptions, id?: string | null, channel?: string) {
        const logId = id !== undefined ? id : this.getLogId();
        // Take the caller's snapshotted channel when there is one: `.channel()` mutates shared
        // config and file writes flush later, so reading it live mislabels concurrent requests.
        const logChannel = channel ?? this.config.channel;
        let logMessage = `[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}][${logChannel}] - ${level.toUpperCase()} -${logId ? `[${logId}]` : ''} ${message}`;
        if (options) {
            // Error instances stringify to "{}" (their fields are non-enumerable); extract them
            // explicitly so stacks are preserved in the log instead of being silently dropped.
            const serializable = options instanceof Error
                ? { name: options.name, message: options.message, stack: options.stack }
                : options;
            // Callers hand us raw request bodies; redact here so no call site can leak a secret.
            logMessage += ` - ${JSON.stringify(redactLogOptions(serializable))}`;
        }
        logMessage += `\n`;
        return logMessage;
    }
    protected async callCallback(level: LogLevel, message: string, options?: LogOptions, channel?: string) {
        // Same snapshot rule as beautifyLogMessage: file writes run at flush time, so reading
        // the channel live would fire the 500-alert callback for whichever channel happened to
        // be set last rather than the one the caller logged to.
        const logChannel = channel ?? this.config.channel;
        if (this.config.callback && this.config.callback.channel === logChannel) {
            // Never let a log callback throw/reject: doing so escapes as an unhandledRejection
            // which, if logged back into the same channel, creates an infinite log loop.
            try {
                // The 500-alert callback re-serializes this into an admin email, so it needs
                // the same redaction the log file gets.
                await this.config.callback.callback(level, message, redactLogOptions(options));
            } catch (error) {
                console.error('LogService: log callback failed (suppressed to avoid log loop)', error);
            }
        }
    }




}