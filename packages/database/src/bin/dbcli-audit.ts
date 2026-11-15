import { randomUUID } from 'node:crypto';
import {
    FactoryLogService,
    LogService,
    runWithLogContext,
} from '@repo/backend-lib/services/log-service';

/**
 * Audit trail for state-changing dbcli commands in `dbcli/<date>.log`. Each run gets its own
 * trace id, so the jobs it enqueues (`db:backup`, `seo:requeue-user`) carry it into the worker.
 */
const dbcliLog = FactoryLogService.createLogService('file', { channel: 'system' });

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

const flush = () => LogService.flush().catch((error) => console.error('Failed to flush dbcli logs:', error));

/**
 * Wraps a command action: "started" (flushed before running, so the record exists even if the
 * script calls `process.exit`), then "finished" or "failed".
 */
export function audited<A extends unknown[]>(
    command: string,
    action: (...args: A) => unknown,
    positionalNames: string[] = [],
): (...args: A) => Promise<void> {
    return (...args: A) =>
        runWithLogContext({ id: randomUUID() }, async () => {
            const startedAt = Date.now();
            dbcliLog.info('dbcli command started', loggedArgs(positionalNames, args), { operation: command });
            await flush();
            try {
                await action(...args);
                dbcliLog.info('dbcli command finished', { duration_ms: Date.now() - startedAt }, { operation: command });
            } catch (error) {
                dbcliLog.error(
                    'dbcli command failed',
                    {
                        duration_ms: Date.now() - startedAt,
                        error_name: error instanceof Error ? error.name : typeof error,
                        error_message: error instanceof Error ? error.message : String(error),
                    },
                    { operation: command },
                );
                throw error;
            } finally {
                await flush();
            }
        });
}
