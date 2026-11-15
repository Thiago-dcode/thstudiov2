import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestLogContext } from '@repo/common-lib/types/request';
import { LOG_CORRELATION_KEYS, LogCorrelation } from './types';

/**
 * The trace of the unit of work in flight: an HTTP request, a BullMQ job, a cron run or a dbcli
 * command. Every logger falls back to it, so lines carry the trace id and correlation even when
 * the logger was built without `RequestService.logBinding()`.
 *
 * Each `runWithLogContext` call gets a fresh store object; there is no module-level request
 * state (a shared client holding per-request state swaps concurrent requests' data).
 */
export type LogContext = {
    id: string | null;
    correlation: LogCorrelation;
    request?: () => RequestLogContext | null;
    job?: { attempt: number; max_attempts: number };
};

export type LogContextInit = {
    id: string | null;
    correlation?: LogCorrelation;
    request?: () => RequestLogContext | null;
    job?: { attempt: number; max_attempts: number };
};

const storage = new AsyncLocalStorage<LogContext>();

const NUMERIC_KEYS = new Set<keyof LogCorrelation>(['user_id', 'media_id', 'attempt']);

/**
 * Whitelists `LOG_CORRELATION_KEYS`, checks each value's type (numbers for `user_id`,
 * `media_id`, `attempt`; non-empty strings otherwise), drops null/undefined and returns the keys
 * in canonical order. Unknown keys and wrongly typed values never reach a line.
 */
export function normalizeCorrelation(input: unknown): LogCorrelation {
    const result: Record<string, unknown> = {};
    if (!input || typeof input !== 'object') return result as LogCorrelation;
    const source = input as Record<string, unknown>;
    for (const key of LOG_CORRELATION_KEYS) {
        const value = source[key];
        if (value === null || value === undefined) continue;
        if (NUMERIC_KEYS.has(key)) {
            if (typeof value === 'number' && Number.isFinite(value)) result[key] = value;
        } else if (typeof value === 'string' && value.length > 0) {
            result[key] = value;
        }
    }
    return result as LogCorrelation;
}

/** `a` with `b` merged over it (b wins), normalised. */
export function mergeCorrelation(a: LogCorrelation | undefined, b: LogCorrelation | undefined): LogCorrelation {
    return normalizeCorrelation({ ...(a ?? {}), ...(b ?? {}) });
}

export function runWithLogContext<T>(init: LogContextInit, fn: () => T): T {
    const store: LogContext = {
        id: init.id ?? null,
        correlation: normalizeCorrelation(init.correlation),
        ...(init.request ? { request: init.request } : {}),
        ...(init.job ? { job: { ...init.job } } : {}),
    };
    return storage.run(store, fn);
}

export function getLogContext(): LogContext | undefined {
    return storage.getStore();
}

/** Adds ids to the CURRENT context only. No-op outside one; null/undefined values are ignored. */
export function addLogCorrelation(fields: LogCorrelation): void {
    const store = storage.getStore();
    if (!store) return;
    store.correlation = mergeCorrelation(store.correlation, normalizeCorrelation(fields));
}

/** Re-points the current context at another trace (e.g. the request that caused a webhook). */
export function setLogTraceId(id: string): void {
    const store = storage.getStore();
    if (!store || typeof id !== 'string' || !id) return;
    store.id = id;
}

/** The current job's attempt, or `null` outside a job context. */
export function currentJobAttempt(): { attempt: number; max_attempts: number; is_final: boolean } | null {
    const job = storage.getStore()?.job;
    if (!job) return null;
    return { attempt: job.attempt, max_attempts: job.max_attempts, is_final: job.attempt >= job.max_attempts };
}
