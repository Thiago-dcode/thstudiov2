import type { LogServiceType } from "../types";

/**
 * The running app's service (api, worker, web, dbcli), for lines whose logger config names none
 * (backend-lib's own loggers). Lives on `globalThis` under a registry symbol, like the process
 * log buffer, so every bundle copy of backend-lib sees the value the entrypoint set.
 */
const PROCESS_SERVICE_KEY = Symbol.for('@repo/backend-lib/logProcessService');

type Registry = { [PROCESS_SERVICE_KEY]?: LogServiceType };

/**
 * Set once, first thing in each app entrypoint. A later call is ignored silently, whatever its
 * value: the first entrypoint to run owns the process.
 */
export function setLogProcessService(service: LogServiceType): void {
    const registry = globalThis as Registry;
    if (registry[PROCESS_SERVICE_KEY]) return;
    Object.defineProperty(globalThis, PROCESS_SERVICE_KEY, {
        value: service,
        writable: false,
        configurable: false,
        enumerable: false,
    });
}

/** The service set by the entrypoint, or `null` before it runs (and in tests that never set it). */
export function getLogProcessService(): LogServiceType | null {
    return (globalThis as Registry)[PROCESS_SERVICE_KEY] ?? null;
}
