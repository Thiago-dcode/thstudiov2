import Redis from 'ioredis';
import { config } from '@repo/common-lib/config';
import { LogCallback, LogConfig, LoggerConfig, LogOverrides, LogServiceType } from '../services/log-service/types';
import { LogService } from '../services/log-service/log.service';
import { criticalAlertMail } from '../utils/critical-alert-mail';
import { LogBuffer } from '../services/log-service/buffers/log.buffer';
import { InMemoryLogBuffer } from '../services/log-service/buffers/in-memory-log.buffer';
import { DEFAULT_LOG_REDIS_KEY, RedisLogBuffer } from '../services/log-service/buffers/redis-log.buffer';
import { FileLogDriver } from '../services/log-service/drivers/file-log.driver';

export { setLogProcessService, getLogProcessService } from '../services/log-service/helpers/process-service';

/** HTTP errors (the exception filter) and fatal process errors. `status_code` is a line field. */
export const API_ERROR_CHANNEL = 'api.error' as const;

const DEFAULT_LOG_RETENTION_DAYS = 30;

/** Set `LOG_RETENTION_DAYS=0` to disable automatic cleanup. */
export function getLogRetentionDays(): number {
  const parsed = parseInt(process.env.LOG_RETENTION_DAYS ?? String(DEFAULT_LOG_RETENTION_DAYS), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_LOG_RETENTION_DAYS;
}

/** Mails the admins for a `critical` line; every other level is ignored. */
export const emailCritical: LogCallback = async (entry) => {
  if (entry.level !== 'CRITICAL') return;
  await criticalAlertMail(entry);
};

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
export function createProcessLogBuffer(env: NodeJS.ProcessEnv = process.env): LogBuffer {
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

function processLogBuffer(): LogBuffer {
  const registry = globalThis as { [LOG_BUFFER_KEY]?: LogBuffer };
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

export const logBuffer: LogBuffer = processLogBuffer();

/**
 * For backend-lib's own loggers, which run in every service: the critical mail. `service: null`:
 * their lines take the one the app's entrypoint set with `setLogProcessService` (see `LoggerConfig`).
 */
export const backendLibLogConfig: LoggerConfig = {
  service: null,
  callback: emailCritical,
};

/** One config per service. The service is also the folder: `<log folder>/<service>/<date>.log`. */
export const logConfig: Record<LogServiceType, LogConfig> = {
  api: {
    service: 'api',
    channel: 'api',
    callback: emailCritical,
  },
  worker: {
    service: 'worker',
    channel: 'queue',
    callback: emailCritical,
  },
  dbcli: {
    service: 'dbcli',
    channel: 'system',
    callback: emailCritical,
  },
  web: {
    service: 'web',
    channel: 'web',
    callback: emailCritical,
  },
};

/** A logger over the process `logBuffer` from `base` plus `overrides`. */
const factory = (base: LoggerConfig) => (overrides: LogOverrides = {}): LogService =>
  new LogService({ ...base, ...overrides }, logBuffer);

/**
 * The only way to build a logger: one factory per service, taking overrides only (channel, name,
 * id, request, ...), never the service or the buffer. `logService.worker({ channel: 'media', id })`
 * writes under `worker/` into the process buffer.
 *
 * `lib` is for backend-lib's own loggers, which run in every app and are partly built at import:
 * their lines take the service the entrypoint set with `setLogProcessService`, read per line.
 */
export const logService = {
  api: factory(logConfig.api),
  worker: factory(logConfig.worker),
  dbcli: factory(logConfig.dbcli),
  web: factory(logConfig.web),
  lib: factory(backendLibLogConfig),
};
