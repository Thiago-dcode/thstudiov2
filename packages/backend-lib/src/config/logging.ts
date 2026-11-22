import os from 'node:os';
import Redis from 'ioredis';
import { config } from '@repo/common-lib/config';
import { LOG_CHANNELS } from '@repo/common-lib/constants/log';
import type {
  ApiLogContext,
  AppBaseLogEntry,
  DbcliLogContext,
  JobLogContext,
  LogChannel,
  LogLevelLabel,
  RequestContext,
  WebLogContext,
} from '@repo/common-lib/types/log';
import { LogContext, LogEntryBase, LogOverrides, Resolvable } from '../services/log-service/types';
import { redactLogOptions } from '../services/log-service/helpers/redact';
import { LogService } from '../services/log-service/log.service';
import { criticalAlertMail } from '../utils/critical-alert-mail';
import { LogBuffer } from '../services/log-service/buffers/log.buffer';
import { InMemoryLogBuffer } from '../services/log-service/buffers/in-memory-log.buffer';
import { DEFAULT_LOG_REDIS_KEY, RedisLogBuffer } from '../services/log-service/buffers/redis-log.buffer';
import { FileLogDriver } from '../services/log-service/drivers/file-log.driver';
import { getLogProcessService } from './log-process-service';

export { setLogProcessService, getLogProcessService } from './log-process-service';

/** The written line (`AppBaseLogEntry`, its `level` uppercase: a Loki label) plus the entry's `format`. */
export type LogEntry = AppBaseLogEntry & LogEntryBase;

const DEFAULT_CHANNEL: LogChannel = 'system';
const REPLICA_MAX_LENGTH = 64;

/**
 * Builds the line that is written: the `AppBaseLogEntry` shape. `channel`, `operation`,
 * `status_code` and `method` are read from the call's options; whatever else the caller passed
 * is `extraInfo`. Options and request are redacted here, so no call site can leak a secret.
 */
export function buildLogEntry(logContext: LogContext, globalContext?: RequestContext): LogEntry {
  const { logOptions, timestamp, id, level, message, format, service } = logContext;
  const { channel, operation, status_code, method, ...others } = logOptions ?? {};
  // A string `method` (login method, provider) is the top-level field, so Alloy can label it.
  // Any other type is not a label candidate: it stays in extraInfo.
  const rest = typeof method === 'string' || method === undefined ? others : { ...others, method };

  // Error instances stringify to "{}" (their fields are non-enumerable): extract them explicitly
  // so stacks are preserved instead of silently dropped.
  const serializable = logOptions instanceof Error
    ? { name: logOptions.name, message: logOptions.message, stack: logOptions.stack }
    : rest;
  const hasExtraInfo = logOptions instanceof Error || Object.keys(rest).length > 0;

  const entry: LogEntry = {
    timestamp: timestamp.toISOString(),
    level: level.toUpperCase() as LogLevelLabel,
    service,
    channel: (LOG_CHANNELS as readonly string[]).includes(channel) ? channel : DEFAULT_CHANNEL,
    operation: typeof operation === 'string' && operation ? operation : null,
    format,
    id: id ?? '',
    message,
    replica: os.hostname().slice(0, REPLICA_MAX_LENGTH),
  };
  if (typeof method === 'string' && method) entry.method = method;
  if (typeof status_code === 'number') entry.status_code = status_code;
  if (globalContext) entry.request = redactLogOptions(globalContext);
  if (hasExtraInfo) entry.extraInfo = redactLogOptions(serializable);
  return entry;
}

/** HTTP errors (the exception filter) and fatal process errors. `status_code` is a line field. */
export const API_ERROR_CHANNEL = 'api.error' as const;

const DEFAULT_LOG_RETENTION_DAYS = 30;

/** Set `LOG_RETENTION_DAYS=0` to disable automatic cleanup. */
export function getLogRetentionDays(): number {
  const parsed = parseInt(process.env.LOG_RETENTION_DAYS ?? String(DEFAULT_LOG_RETENTION_DAYS), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_LOG_RETENTION_DAYS;
}

/**
 * Mails the admins for a `critical` line; every other level is ignored. The mail reads the line
 * as it is written (`buildLogEntry`), so it shows the same channel, operation and extraInfo.
 */
export async function emailCritical(logContext: LogContext, globalContext?: RequestContext): Promise<void> {
  if (logContext.level !== 'critical') return;
  await criticalAlertMail(buildLogEntry(logContext, globalContext));
}

/**
 * The process's log buffer: every line any service logs is pushed to it. Only the worker's
 * scheduled `JOB_FLUSH_LOGS` job flushes it (every 5 s); a process `settle()`s it before exit.
 *
 * Under Jest (which sets `NODE_ENV=test`) it is an in-memory buffer, so no suite opens a Redis
 * handle through it. A test that needs Redis builds its own `RedisLogBuffer` over a fake.
 * Everywhere else it is the shared Redis list `logs:pending`. The client is built on the first
 * line, never at import: importing this module (the web app does) opens nothing, reads no config
 * and touches no file. The driver has no folder, so it resolves `LOG_STORAGE_DIR` (else
 * `storage/logs`) on the first write.
 */
export function createProcessLogBuffer(env: NodeJS.ProcessEnv = process.env): LogBuffer<LogEntry> {
  if (env.NODE_ENV === 'test') return new InMemoryLogBuffer(new FileLogDriver());
  return new RedisLogBuffer(
    new FileLogDriver(),
    () => new Redis(config().redis.url ?? '', { lazyConnect: true, maxRetriesPerRequest: 3 }),
    DEFAULT_LOG_REDIS_KEY,
  );
}

/**
 * One per process, even when this module is loaded more than once (Next.js gives each server
 * bundle its own copy of backend-lib): the instance lives on `globalThis` under a registry
 * symbol, and the first copy to load creates it. It is read-only, so nothing can replace it.
 */
const LOG_BUFFER_KEY = Symbol.for('@repo/backend-lib/logBuffer');

function processLogBuffer(): LogBuffer<LogEntry> {
  const registry = globalThis as { [LOG_BUFFER_KEY]?: LogBuffer<LogEntry> };
  if (!registry[LOG_BUFFER_KEY]) {
    Object.defineProperty(globalThis, LOG_BUFFER_KEY, {
      value: createProcessLogBuffer(),
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
  return registry[LOG_BUFFER_KEY]!;
}

export const logBuffer: LogBuffer<LogEntry> = processLogBuffer();

/** A logger over the process `logBuffer`: the service, the critical mail and the line builder are the factory's. */
const factory = <T extends RequestContext>(service: Resolvable<string>) =>
  (overrides: LogOverrides<T> = {}): LogService<T, LogEntry> =>
    new LogService<T, LogEntry>({ callback: emailCritical, ...overrides, service }, logBuffer, buildLogEntry);

/**
 * The only way to build a logger: one factory per service, taking overrides only (id,
 * globalContext, defaultOptions, ...), never the service or the buffer. Each service has its own
 * `globalContext` type, written as the line's redacted `request`. The channel (and a default
 * operation) is a default option: `logService.worker({ defaultOptions: { channel: 'media' }, id })`
 * writes under `worker/` into the process buffer; a logger with none writes channel `system`.
 *
 * `lib` is for backend-lib's own loggers, which run in every app and are partly built at import:
 * their lines take the service the entrypoint set with `setLogProcessService`, read per line
 * (`unknown` before it ran). They have no `request`.
 */
export const logService = {
  api: factory<ApiLogContext>('api'),
  worker: factory<JobLogContext>('worker'),
  dbcli: factory<DbcliLogContext>('dbcli'),
  web: factory<WebLogContext>('web'),
  lib: (overrides: Omit<LogOverrides, 'globalContext'> = {}): LogService<RequestContext, LogEntry> =>
    factory<RequestContext>(() => getLogProcessService() ?? 'unknown')(overrides),
};

/**
 * The web logger (`logService.web`), named so a module that exports one can annotate it: an
 * inferred type would have to reference `LogService` from backend-lib's dist path (TS2883).
 */
export type WebLogger = ReturnType<typeof logService.web>;

/** A backend-lib logger (`logService.lib`). */
export type LibLogger = ReturnType<typeof logService.lib>;
