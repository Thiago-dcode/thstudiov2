import { LogConfig, LogOverrides, LogService } from '@repo/backend-lib/services/log-service';
import { logConfig, logService } from '@repo/backend-lib/config/logging';
import { currentRequestId, currentRequestLogContext } from 'src/common/services/request-storage';

/** The current request/job/cron trace id and HTTP request context, read per line from the store. */
const requestBound = { id: currentRequestId, request: currentRequestLogContext };

/**
 * The api log config with the request-bound id and request (`config` wins). A trace carrier: pass
 * it to every `QueueHelper` call so the job carries the trace id onward.
 */
export function apiLogConfig(config: Partial<LogConfig> = {}): LogConfig {
  return { ...logConfig.api, ...requestBound, ...config };
}

/**
 * `logService.api` with the request-bound id and request: safe on a shared logger. Never call
 * `.name()`/`.channel()` on a shared one.
 */
export function createApiLogger(overrides: LogOverrides = {}): LogService {
  return logService.api({ ...requestBound, ...overrides });
}
