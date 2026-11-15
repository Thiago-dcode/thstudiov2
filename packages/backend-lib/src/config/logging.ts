import { LogConfig } from '../services/log-service/types';
import { resolveDefaultLogFolder } from '../services/log-service';


export type LogginChannels = 'api' | 'users';
/** HTTP errors (the exception filter) and fatal process errors. `status_code` is a line field. */
export const API_ERROR_CHANNEL = 'api.error' as const;
export type AppLogConfig = {
  [channel in LogginChannels]: LogConfig;
};

const DEFAULT_LOG_RETENTION_DAYS = 30;

/** Set `LOG_RETENTION_DAYS=0` to disable automatic cleanup. */
export function getLogRetentionDays(): number {
  const parsed = parseInt(process.env.LOG_RETENTION_DAYS ?? String(DEFAULT_LOG_RETENTION_DAYS), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_LOG_RETENTION_DAYS;
}

/**
 * Alerting is no longer per config: a `critical` line goes to the handler each entrypoint
 * registers with `configureLogProcess` (see `utils/critical-alert-mail`).
 */
export const logConfig: AppLogConfig = {
  api: {
    channel: 'api',
    logFolder: resolveDefaultLogFolder(),
  },
  users: {
    channel: 'users',
  },
};
