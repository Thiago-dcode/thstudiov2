import os from 'node:os';
import { CriticalLogHandler } from './types';

/**
 * Process-wide logging config, set once by each entrypoint (`apps/api/src/log-process.ts`,
 * `apps/worker/src/log-process.ts`, dbcli). Holds no request data: per-request values still flow
 * through `RequestService.logBinding()` functions.
 */
type LogProcessState = {
    service: string | null;
    onCritical: CriticalLogHandler | null;
};

const state: LogProcessState = { service: null, onCritical: null };

/** Becomes a directory name under the log root, so it must never be able to escape it. */
const SERVICE_PATTERN = /^[a-z][a-z0-9-]{0,31}$/;
const UNKNOWN_SERVICE = 'unknown';
const REPLICA_MAX_LENGTH = 64;

export type ConfigureLogProcessOptions = {
    service: string;
    /** Called for every `critical` line. `null` (or omitted) means critical lines only get written. */
    onCritical?: CriticalLogHandler | null;
};

export function configureLogProcess(opts: ConfigureLogProcessOptions): void {
    state.service = opts.service;
    state.onCritical = opts.onCritical ?? null;
}

function sanitiseService(value: string | null | undefined): string {
    const normalised = (value ?? '').trim().toLowerCase();
    return SERVICE_PATTERN.test(normalised) ? normalised : UNKNOWN_SERVICE;
}

/**
 * `service`: the configured value, else `LOG_SERVICE`, else `unknown`. Code wins because api and
 * worker share one `env_file` in compose. `replica`: the hostname, which in Docker is the
 * container id, so it differs per replica.
 */
export function getLogProcessContext(): { service: string; replica: string } {
    return {
        service: sanitiseService(state.service || process.env.LOG_SERVICE || null),
        replica: os.hostname().slice(0, REPLICA_MAX_LENGTH),
    };
}

/** @internal Used by LogService to dispatch critical lines. */
export function getCriticalHandler(): CriticalLogHandler | null {
    return state.onCritical;
}
