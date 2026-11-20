import os from "node:os";
import { RequestLogContext } from "@repo/common-lib/types/request";
import {
    DEFAULT_LOG_FORMAT,
    LoggerConfig,
    LogEntry,
    LogChannel,
    LogFormat,
    LogLevel,
    LogLineFields,
    LogOptions,
    LogServiceType,
    Resolvable,
} from "./types";
import { redactLogOptions } from "./helpers/redact";
import { LogBuffer } from "./buffers/log.buffer";
import { getLogProcessService } from "./helpers/process-service";

const DEFAULT_CHANNEL: LogChannel = 'system';
const UNKNOWN_SERVICE = 'unknown';
const REPLICA_MAX_LENGTH = 64;

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

export class LogService {

    protected readonly config: LoggerConfig;
    protected readonly logBuffer: LogBuffer;

    constructor(
        config: LoggerConfig,
        logBuffer: LogBuffer
    ) {
        // Own the config: callers pass the shared `logConfig.*` objects, and the setters and
        // builders below mutate `this.config`.
        this.config = { ...config };
        this.logBuffer = logBuffer;
    }

    /** Mutates this instance: never call it on a shared or DI logger, set the channel in config. */
    public channel(channel: LogChannel) {
        this.config.channel = channel;
        return this;
    }

    /** Mutates this instance: never call it on a shared or DI logger. */
    public service(service: LogServiceType) {
        this.config.service = service;
        return this;
    }

    /** Sets the line's `operation`. Mutates this instance: on a shared logger pass `{ operation }` per call. */
    public name(name: string) {
        this.config.name = name;
        return this;
    }

    set id(id: Resolvable<string | null>) {
        this.config.id = id;
    }

    /** The trace id, with the function form resolved. */
    get id(): string | null {
        return resolve(this.config.id, 'id');
    }

    set request(request: Resolvable<RequestLogContext | null>) {
        this.config.request = request;
    }

    /** The request, with the function form resolved. */
    get request(): RequestLogContext | null {
        return resolve(this.config.request, 'request');
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

    public critical(message: string, options?: LogOptions, fields?: LogLineFields): this {
        return this.log('critical', message, options, fields);
    }

    /**
     * Builds the line now (timestamp, config, `id`/`request` read in the caller's request), queues
     * it in the buffer, and fires the callback right away: a callback never waits for a flush.
     */
    protected log(level: LogLevel, message: string, options?: LogOptions, fields?: LogLineFields): this {
        const entry = this.buildLogEntry(level, message, options, fields, new Date());
        this.logBuffer.add(entry);
        this.runCallback(entry);
        return this;
    }

    /** Not awaited by anyone. Tracked so `settle()` can wait for it before exit. */
    private runCallback(entry: LogEntry): void {
        const callback = this.config.callback;
        if (!callback) return;
        const run = (async () => {
            try {
                await callback(entry);
            } catch (error) {
                // Never log through a LogService here: a failing callback that logged could loop.
                console.error('LogService: log callback failed', error);
            }
        })();
        this.logBuffer.track(run);
    }

    protected getFormat(): LogFormat {
        return this.config.format ?? DEFAULT_LOG_FORMAT;
    }

    protected buildLogEntry(
        level: LogLevel,
        message: string,
        options: LogOptions | undefined,
        fields: LogLineFields | undefined,
        timestamp: Date,
    ): LogEntry {
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
        const config = this.config;
        const id = this.id;
        const request = this.request;
        // Built in the JSON key order. Absent optional keys are left out, never `null`.
        const entry: LogEntry = {
            // ISO 8601 UTC with ms: Loki parses it as RFC3339 and keeps same-second order.
            timestamp: timestamp.toISOString(),

            level: level.toUpperCase() as Uppercase<LogLevel>,
            id,
            // `service: null` (backend-lib's own loggers) writes under the running app's.
            service: config.service ?? getLogProcessService() ?? UNKNOWN_SERVICE,
            message,
            method: request?.method ? parseInt(request.method) : undefined,
            format: this.getFormat(),
            replica: os.hostname().slice(0, REPLICA_MAX_LENGTH),
            channel: config.channel ?? DEFAULT_CHANNEL,
            operation: fields?.operation || config.name || null,

        };
        if (typeof fields?.status_code === 'number') entry.status_code = fields.status_code;
        if (request) entry.request = redactLogOptions(request);
        if (extraInfo !== undefined) entry.extraInfo = extraInfo;
        return entry;
    }
}
