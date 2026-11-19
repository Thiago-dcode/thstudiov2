import type Redis from "ioredis";
import { LogBuffer } from "./log.buffer";
import { LogDriver } from "../drivers/log.driver";
import { LogEntry } from "../types";

export const DEFAULT_LOG_REDIS_KEY = 'logs:pending';

/**
 * Most lines the list may hold (~1 KB each, so ~50 MB). Redis is capped at 256 MB with
 * `noeviction` and is also the BullMQ broker: an unbounded backlog (the worker down for hours)
 * would fill it and make every enqueue fail. Past the cap the oldest lines are dropped instead.
 */
export const DEFAULT_LOG_REDIS_MAX_LENGTH = 50_000;

/** At most one "dropping lines" warning per process per interval, so a long outage doesn't flood stderr. */
const TRIM_WARNING_EVERY_MS = 60_000;

/** What `service` may be in a stored line: it becomes a folder name, so no path separators. */
const SERVICE_PATTERN = /^[a-z0-9-]+$/;

/**
 * Keeps the pending entries in one Redis list (`key`), each one a JSON `LogEntry`: data only,
 * never code. Every service pushes to the same list and the worker's scheduled flush writes them
 * all, so lines survive a restart. Share a key only between processes whose driver writes to the
 * same place.
 *
 * `redis` may be a factory: it is called once, on the first `add`/`length`/`flush`, so building
 * the buffer at import opens nothing.
 */
export class RedisLogBuffer extends LogBuffer {
    /** Pushes sent but not yet acknowledged. `flush()` waits for them, so it always sees them. */
    private pushing = new Set<Promise<unknown>>();
    private client: Redis | null = null;
    private lastTrimWarning = 0;

    constructor(
        logDriver: LogDriver,
        private readonly redis: Redis | (() => Redis),
        private readonly key: string = DEFAULT_LOG_REDIS_KEY,
        private readonly maxLength: number = DEFAULT_LOG_REDIS_MAX_LENGTH,
    ) {
        super(logDriver);
    }

    /** The client, built by the factory on first use and kept. */
    private getClient(): Redis {
        this.client ??= typeof this.redis === 'function' ? (this.redis as () => Redis)() : this.redis;
        return this.client;
    }

    add(entry: LogEntry): void {
        let json: string;
        try {
            json = JSON.stringify(entry);
        } catch (error) {
            console.error('LogBuffer: a log line could not be serialised', error);
            return;
        }
        let sent: Promise<unknown>;
        try {
            // RPUSH is atomic, so processes sharing the key never overwrite each other's lines.
            sent = this.getClient().rpush(this.key, json);
        } catch (error) {
            // A factory that throws must not cost the line either.
            sent = Promise.reject(error);
        }
        const push = sent.then((length) => this.trimIfOver(length as number), (error: unknown) => {
            // Redis is down: write the line now rather than lose it. If the push did land (a
            // timeout after the server applied it) the line is written twice; never zero times.
            console.error('LogBuffer: Redis push failed, writing the line directly', error);
            return this.write(entry);
        });
        this.pushing.add(push);
        void push.finally(() => this.pushing.delete(push));
        this.track(push);
    }

    /**
     * RPUSH returns the new length, so a normal push costs no extra command. Over the cap, keep
     * the newest `maxLength` lines. Pushes from other processes may overshoot by a few lines
     * between the RPUSH and the LTRIM; the next trim takes them.
     */
    private async trimIfOver(length: number): Promise<void> {
        if (!(length > this.maxLength)) return;
        try {
            await this.getClient().ltrim(this.key, -this.maxLength, -1);
        } catch (error) {
            console.error('LogBuffer: trimming the Redis log list failed', error);
            return;
        }
        const now = Date.now();
        if (now - this.lastTrimWarning >= TRIM_WARNING_EVERY_MS) {
            this.lastTrimWarning = now;
            console.error(`LogBuffer: ${this.key} is over ${this.maxLength} lines (is the worker flushing?); dropping the oldest`);
        }
    }

    async length(): Promise<number> {
        return this.getClient().llen(this.key);
    }

    /**
     * Never rejects, like the in-memory one: a Redis error is reported and the lines stay in the
     * list (DEL did not run) for the next flush.
     */
    async flush(): Promise<void> {
        const run = (async () => {
            // This process's lines logged before the flush must be in the list first, even on
            // an auto-pipelining client that sends the RPUSHes after the MULTI.
            await Promise.all([...this.pushing]);
            // Read and clear in one transaction: another process's flush can't take the same lines.
            const result = await this.getClient().multi().lrange(this.key, 0, -1).del(this.key).exec();
            const [error, items] = result?.[0] ?? [null, []];
            if (error) throw error;
            const entries = (items as string[]).flatMap((item) => parseEntry(item));
            await Promise.all(entries.map((entry) => this.write(entry)));
        })().catch((error: unknown) => {
            console.error('LogBuffer: Redis flush failed, the lines stay queued', error);
        });
        this.track(run);
        await run;
    }
}

/** A stored line back to an entry. Anything that isn't a log entry is reported and skipped. */
function parseEntry(item: string): LogEntry[] {
    let value: unknown;
    try {
        value = JSON.parse(item);
    } catch (error) {
        console.error('LogBuffer: skipping a malformed stored log line', error);
        return [];
    }
    if (!isLogEntry(value)) {
        console.error('LogBuffer: skipping a stored value that is not a log entry');
        return [];
    }
    return [value];
}

function isLogEntry(value: unknown): value is LogEntry {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const entry = value as Record<string, unknown>;
    return typeof entry.service === 'string' && SERVICE_PATTERN.test(entry.service)
        && typeof entry.timestamp === 'string'
        && typeof entry.level === 'string'
        && typeof entry.message === 'string';
}
