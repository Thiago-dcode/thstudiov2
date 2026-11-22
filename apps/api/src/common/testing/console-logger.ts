import { LogBuffer, LogContext, LogDriver, LogOverrides, LogService } from '@repo/backend-lib/services/log-service';
import { buildLogEntry, emailCritical, LogEntry } from '@repo/backend-lib/config/logging';
import type { ApiLogContext } from '@repo/common-lib/types/log';
import { RequestService, type ApiLogger } from 'src/common/services/request.service';
import {
  currentRequestId,
  currentRequestLogContext,
  requestStorage,
} from 'src/common/services/request-storage';

/** Specs only: prints each line (`console.log/warn/error/debug`, one JSON line each) as it is written. */
class ImmediateConsoleLogDriver extends LogDriver<LogEntry> {
  async process(logContext: LogContext, entry: LogEntry): Promise<void> {
    const line = this.formatLogEntry(logContext.format, entry).trimEnd();
    switch (entry.level) {
      case 'ERROR':
      case 'CRITICAL':
        console.error(line);
        break;
      case 'WARN':
        console.warn(line);
        break;
      case 'DEBUG':
        console.debug(line);
        break;
      default:
        console.log(line);
    }
  }
}

/**
 * Specs only. A buffer that prints each line the moment it is logged, so a spec can read what a
 * logger wrote without a flush. Never in app code: the process buffer is the only one there.
 */
export class ImmediateConsoleLogBuffer extends LogBuffer<LogEntry> {
  constructor() {
    super(new ImmediateConsoleLogDriver());
  }

  add(logContext: LogContext, entry: LogEntry): void {
    // The console driver prints synchronously, before its first await.
    this.track(this.write(logContext, entry));
  }

  async length(): Promise<number> {
    return 0;
  }

  async flush(): Promise<void> {}
}

/**
 * Specs only: an api logger (service `api`, the request/job trace id and request context read from
 * the store per line) printing its lines straight away. Never the critical mail (it would enqueue
 * through Redis): only a `overrides.callback` other than `emailCritical` runs. Built directly, never
 * through `logService.api`: specs spy that to return `consoleLogger(cfg)`.
 */
export function consoleLogger(overrides: LogOverrides<ApiLogContext> = {}): ApiLogger {
  return new LogService<ApiLogContext, LogEntry>(
    {
      service: 'api',
      id: currentRequestId,
      globalContext: () => currentRequestLogContext() ?? undefined,
      ...overrides,
      callback: overrides.callback === emailCritical ? undefined : overrides.callback,
    },
    new ImmediateConsoleLogBuffer(),
    buildLogEntry,
  );
}

/**
 * Specs only: a `RequestService` over the process `requestStorage` whose `log()` returns `logger`
 * when given, else a `consoleLogger` with the channel/operation/trace id as the real one would.
 */
export function consoleRequestService(logger?: ApiLogger): RequestService {
  const service = new RequestService(requestStorage);
  service.log = (channel, { operation, traceId } = {}) =>
    logger ??
    consoleLogger({
      defaultOptions: operation ? { channel, operation } : { channel },
      ...(traceId !== undefined ? { id: traceId } : {}),
    });
  return service;
}
