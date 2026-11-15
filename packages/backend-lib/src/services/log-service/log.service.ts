import { format } from "date-fns";
import { Queue, JobsOptions } from "bullmq";
import { JOB_FLUSH_LOGS } from "@repo/common-lib/constants/queues";
import {
    DEFAULT_LOG_FORMAT,
    LogConfig,
    LogEntry,
    LogCorrelation,
    LogFormat,
    LogLevel,
    LogLineFields,
    LogOptions,
    LogServiceDriver,
    StatusClass,
} from "./types";
import { LogChannel } from "./channels";
import { redactLogOptions } from "./redact";
import { getCriticalHandler, getLogProcessContext } from "./process-context";
import { getLogContext, mergeCorrelation } from "./log-context";
import { RequestLogContext } from "@repo/common-lib/types/request";

const DEFAULT_LOG_JOB_OPTIONS: JobsOptions = {
    priority: 10,
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
};

/**
 * Everything a line reads from mutable config or the environment, captured at one instant.
 * Deferred drivers take it when the level method is called; fields left `undefined` are read live.
 */
export type LogSnapshot = {
    timestamp?: Date;
    id?: string | null;
    channel?: LogChannel;
    operation?: string | null;
    request?: RequestLogContext | null;
    /** Already merged and normalised; `{}` means none. */
    correlation?: LogCorrelation;
    service?: string;
    replica?: string;
};

/** `'4xx'` for 404; `null` unless `code` is an integer in 100-599. */
export function statusClassOf(code: unknown): StatusClass | null {
    if (typeof code !== 'number' || !Number.isInteger(code) || code < 100 || code > 599) return null;
    return `${Math.floor(code / 100)}xx` as StatusClass;
}

export abstract class LogService {
    protected static type: LogServiceDriver;
    private static pendingLogs: (() => Promise<void>)[] = [];
    /** Batches being written right now, settled or not. Read only by `flushAndSettle()`. */
    private static inFlight = new Set<Promise<void>>();

    protected readonly config: LogConfig;

    constructor(
        config: LogConfig,
        protected readonly queue?: Queue,
    ) {
        // Own the config. Callers pass the shared `logConfig.*` singletons, and the builder
        // methods below mutate `this.config` — so without this copy, one channel-builder call
        // permanently rewrote the channel for every other logger built from the same object.
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
        const run = Promise.all(batch.map(cb => cb()));
        const settled = run.then(() => undefined, () => undefined);
        LogService.inFlight.add(settled);
        void settled.then(() => LogService.inFlight.delete(settled));
        await run;
    }

    /**
     * Flushes, then also waits for flushes other callers already started. A `critical` line starts
     * its own flush (FileLogService), which takes the line before a later `flush()` can see it, so
     * `flush()` alone can return before the alert mail is enqueued. Use this before `process.exit`.
     * Never rejects.
     */
    public static async flushAndSettle(): Promise<void> {
        await LogService.flush().catch(() => undefined);
        await Promise.all([...LogService.inFlight]);
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

    /** Mutates this instance: never call it on a shared or DI logger, set the channel in config. */
    public channel(channel: LogChannel) {
        this.config.channel = channel;
        return this;
    }
    /** Sets the line's `operation`. */
    public name(name: string) {
        this.config.name = name;
        return this;
    }
    public id(id: string | (() => string | null)) {
        this.config.id = id;
        return this;
    }
    /**
     * Never pass a plain object on a DI-shared logger: concurrent requests would overwrite each
     * other. Use the function form from `RequestService.logBinding()`.
     */
    public request(request: LogConfig['request']) {
        this.config.request = request;
        return this;
    }

    public info(message: string, options?: LogOptions, fields?: LogLineFields): this {
        return this.log('info', message, options, fields);
    }

    public error(message: string, options?: LogOptions, fields?: LogLineFields): this {
        return this.log('error', message, options, fields);
    }

    public warn(message: string, options?: LogOptions, fields?: LogLineFields): this {
        return this.log('warn', message, options, fields);
    }

    public debug(message: string, options?: LogOptions, fields?: LogLineFields): this {
        return this.log('debug', message, options, fields);
    }

    public success(message: string, options?: LogOptions, fields?: LogLineFields): this {
        return this.log('success', message, options, fields);
    }

    /** The only level that alerts: the process's critical handler (admin mail) gets the entry. */
    public critical(message: string, options?: LogOptions, fields?: LogLineFields): this {
        return this.log('critical', message, options, fields);
    }

    /** Synchronous drivers: build, print, then dispatch a critical line. */
    protected log(level: LogLevel, message: string, options?: LogOptions, fields?: LogLineFields): this {
        const entry = this.buildLogEntry(level, message, options, fields);
        this.print(level, this.formatLogEntry(entry));
        if (level === 'critical') void this.dispatchCritical(entry);
        return this;
    }

    protected print(level: LogLevel, line: string): void {
        switch (level) {
            case 'error':
            case 'critical':
                console.error(line);
                return;
            case 'warn':
                console.warn(line);
                return;
            case 'debug':
                console.debug(line);
                return;
            default:
                console.log(line);
        }
    }

    protected getLogId(): string | null {
        const configured = typeof this.config.id === 'function' ? this.config.id() : (this.config.id || null);
        // Falls back to the log context (request, job, cron run) so unbound loggers keep the trace.
        return configured ?? getLogContext()?.id ?? null;
    }

    protected getRequestContext(): RequestLogContext | null {
        const request = this.config.request;
        const configured = (typeof request === 'function' ? request() : request) ?? null;
        return configured ?? getLogContext()?.request?.() ?? null;
    }

    /** Per-call operation wins over the config `name`, so shared loggers never need `.name()`. */
    protected getOperation(fields?: LogLineFields): string | null {
        return fields?.operation || this.config.name || null;
    }

    /** The context's correlation with the call's merged over it, whitelisted and in key order. */
    protected getCorrelation(fields?: LogLineFields): LogCorrelation {
        return mergeCorrelation(getLogContext()?.correlation, fields?.correlation);
    }

    protected getFormat(): LogFormat {
        return this.config.format ?? DEFAULT_LOG_FORMAT;
    }

    /** Captures everything mutable now: config (shared builders), request store, process, clock. */
    protected takeSnapshot(fields?: LogLineFields): Required<LogSnapshot> {
        const { service, replica } = getLogProcessContext();
        return {
            timestamp: new Date(),
            id: this.getLogId(),
            channel: this.config.channel,
            operation: this.getOperation(fields),
            request: this.getRequestContext(),
            // A copy: the context store keeps changing after this call.
            correlation: this.getCorrelation(fields),
            service,
            replica,
        };
    }

    protected buildLogEntry(
        level: LogLevel,
        message: string,
        options?: LogOptions,
        fields?: LogLineFields,
        snapshot: LogSnapshot = {},
    ): LogEntry {
        const live = snapshot.service === undefined || snapshot.replica === undefined
            ? getLogProcessContext()
            : null;
        const timestamp = snapshot.timestamp ?? new Date();
        const request = snapshot.request !== undefined ? snapshot.request : this.getRequestContext();
        const correlation = snapshot.correlation ?? this.getCorrelation(fields);

        let extraInfo: unknown = undefined;
        if (options) {
            // Error instances stringify to "{}" (their fields are non-enumerable); extract them
            // explicitly so stacks are preserved in the log instead of being silently dropped.
            const serializable = options instanceof Error
                ? { name: options.name, message: options.message, stack: options.stack }
                : options;
            // Callers hand us raw request bodies; redact here so no call site can leak a secret.
            extraInfo = redactLogOptions(serializable);
        }

        // Built in the JSON key order. Absent optional keys are left out, never `null`.
        const entry: LogEntry = {
            // ISO 8601 UTC with ms: Loki parses it as RFC3339 and keeps same-second order.
            timestamp: timestamp.toISOString(),
            service: snapshot.service ?? live!.service,
            replica: snapshot.replica ?? live!.replica,
            channel: snapshot.channel ?? this.config.channel,
            operation: snapshot.operation !== undefined ? snapshot.operation : this.getOperation(fields),
            level: level.toUpperCase() as Uppercase<LogLevel>,
            id: snapshot.id !== undefined ? snapshot.id : this.getLogId(),
            message,
        };
        // Only `status_code` (plus its derived `status`) and `correlation` reach the top level from a call.
        if (typeof fields?.status_code === 'number') {
            entry.status_code = fields.status_code;
            // Right after status_code; only for a real HTTP status, so the label has 5 values.
            const statusClass = statusClassOf(fields.status_code);
            if (statusClass) entry.status = statusClass;
        }
        if (Object.keys(correlation).length > 0) entry.correlation = correlation;
        // The context is allow-listed already; redacting it again is defence in depth.
        if (request) entry.request = redactLogOptions(request);
        if (extraInfo !== undefined) entry.extraInfo = extraInfo;
        return entry;
    }

    protected formatLogEntry(entry: LogEntry): string {
        if (this.getFormat() === 'string') {
            const timestamp = format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss');
            const operation = entry.operation ? `[${entry.operation}]` : '';
            const id = entry.id ? `[${entry.id}]` : '';
            const method = entry.request?.method ? `[${entry.request.method}]` : '';
            let line = `[${timestamp}][${entry.channel}]${operation} - ${entry.level} -${id}${method} ${entry.message}`;
            if (entry.extraInfo !== undefined) line += ` - ${JSON.stringify(entry.extraInfo)}`;
            return line + '\n';
        }
        return JSON.stringify(entry) + '\n';
    }

    /**
     * Hands a critical entry to the process's handler. Never throws or rejects, and never logs
     * through a LogService: a failing alert that logged back here could loop forever.
     */
    protected async dispatchCritical(entry: LogEntry): Promise<void> {
        const handler = getCriticalHandler();
        if (!handler) return;
        try {
            await handler(entry);
        } catch (error) {
            console.error('LogService: critical handler failed (suppressed to avoid a log loop)', error);
        }
    }
}