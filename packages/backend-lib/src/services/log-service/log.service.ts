import { format } from "date-fns";
import { Queue, JobsOptions } from "bullmq";
import { JOB_FLUSH_LOGS } from "@repo/common-lib/constants/constants";
import { LogConfig, LogLevel, LogOptions, LogServiceDriver } from "./types";

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

    constructor(
        protected readonly config: LogConfig,
        protected readonly queue?: Queue,
    ) {
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
     * Queues a flush job via BullMQ for async processing.
     * Requires a Queue instance passed in the constructor.
     */
    public async flushAsync(jobOptions?: JobsOptions): Promise<void> {
        if (!this.queue) {
            throw new Error('LogService: a BullMQ Queue is required for flushAsync. Pass it in the constructor.');
        }
        if (!LogService.pendingLogs.length) return;
        await this.queue.add(
            JOB_FLUSH_LOGS,
            {},
            {
                ...DEFAULT_LOG_JOB_OPTIONS,
                jobId: `log-flush-${Date.now()}`,
                ...jobOptions,
            },
        );
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

    protected beautifyLogMessage(level: LogLevel, message: string, options?: LogOptions, id?: string | null) {
        const logId = id !== undefined ? id : this.getLogId();
        let logMessage = `[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}][${this.config.channel}] - ${level.toUpperCase()} -${logId ? `[${logId}]` : ''} ${message}`;
        if (options) {
            // Error instances stringify to "{}" (their fields are non-enumerable); extract them
            // explicitly so stacks are preserved in the log instead of being silently dropped.
            const serializable = options instanceof Error
                ? { name: options.name, message: options.message, stack: options.stack }
                : options;
            logMessage += ` - ${JSON.stringify(serializable)}`;
        }
        logMessage += `\n`;
        return logMessage;
    }
    protected async callCallback(level: LogLevel, message: string, options?: LogOptions) {
        if (this.config.callback && this.config.callback.channel === this.config.channel) {
            // Never let a log callback throw/reject: doing so escapes as an unhandledRejection
            // which, if logged back into the same channel, creates an infinite log loop.
            try {
                await this.config.callback.callback(level, message, options);
            } catch (error) {
                console.error('LogService: log callback failed (suppressed to avoid log loop)', error);
            }
        }
    }




}