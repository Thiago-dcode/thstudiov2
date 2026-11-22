import { randomUUID } from 'node:crypto';
import type { LogTraceCarrier } from '@repo/backend-lib/utils';
import { logBuffer, logService } from '@repo/backend-lib/config/logging';

/**
 * The running command: its trace id (the line's `id`) and name (the line's `request`), set once
 * per `audited` run. A dbcli process runs one command, so module state is safe here (unlike in a
 * server, where it would leak across requests).
 */
let run: { id: string; command: string } | null = null;

const runContext = () => (run ? { command: run.command } : undefined);

/**
 * The dbcli trace carrier, read when a line is written (the run starts after this is built).
 * Pass it to every `QueueHelper` call, so the jobs a command enqueues (`db:backup`,
 * `seo:requeue-user`) carry the run id into the worker.
 */
export function dbcliTraceCarrier(): LogTraceCarrier {
    return { service: 'dbcli', id: () => run?.id ?? null, globalContext: runContext };
}

/** Audit trail for state-changing dbcli commands in `dbcli/<date>.log` (written by the worker). */
const dbcliLog = logService.dbcli({
    id: () => run?.id ?? null,
    globalContext: runContext,
    defaultOptions: { channel: 'system' },
});

/** Only these arguments are logged (snake_case). Never passwords or connection strings. */
const LOGGED_ARGS = new Set([
    'steps',
    'all',
    'name',
    'date',
    'allow_production',
    'apply',
    'delete_old',
    'dry_run',
    'user',
    'media_id',
    'username',
]);

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const toLoggedValue = (value: unknown): unknown => {
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    return undefined;
};

/** Commander passes positionals, then the options object, then the Command itself. */
function loggedArgs(positionalNames: string[], args: unknown[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const add = (key: string, value: unknown) => {
        const snake = toSnake(key);
        const logged = toLoggedValue(value);
        if (LOGGED_ARGS.has(snake) && logged !== undefined) result[snake] = logged;
    };
    positionalNames.forEach((name, index) => add(name, args[index]));
    const options = args[positionalNames.length];
    if (options && typeof options === 'object' && !Array.isArray(options)) {
        for (const [key, value] of Object.entries(options as Record<string, unknown>)) add(key, value);
    }
    return result;
}

/**
 * Wraps a command action: "started" (settled before running, so the line is in the shared log
 * buffer even if the script calls `process.exit`), then "finished" or "failed". Never flushes:
 * the worker writes the lines.
 */
export function audited<A extends unknown[]>(
    command: string,
    action: (...args: A) => unknown,
    positionalNames: string[] = [],
): (...args: A) => Promise<void> {
    return async (...args: A) => {
        run = { id: randomUUID(), command };
        const startedAt = Date.now();
        dbcliLog.info('dbcli command started', { ...loggedArgs(positionalNames, args), operation: command });
        await logBuffer.settle();
        try {
            await action(...args);
            dbcliLog.info('dbcli command finished', { duration_ms: Date.now() - startedAt, operation: command });
        } catch (error) {
            dbcliLog.error(
                'dbcli command failed',
                {
                    duration_ms: Date.now() - startedAt,
                    error_name: error instanceof Error ? error.name : typeof error,
                    error_message: error instanceof Error ? error.message : String(error),
                    operation: command,
                },
            );
            throw error;
        } finally {
            await logBuffer.settle();
        }
    };
}
