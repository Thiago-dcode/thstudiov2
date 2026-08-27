import {
  LogConfig,
  LogLevel,
  LogOptions,
} from '../services/log-service/types';
import { resolveDefaultLogFolder } from '../services/log-service';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { callback500ErrorMail } from '../utils/callback-500-error-mail';


export type LogginChannels = 'api' | 'users';
export const API_ERRORS_CHANNEL = 'api/errors' as const;
export type AppLogConfig = {
  [channel in LogginChannels]: LogConfig;
};

const DEFAULT_LOG_RETENTION_DAYS = 30;

/** Set `LOG_RETENTION_DAYS=0` to disable automatic cleanup. */
export function getLogRetentionDays(): number {
  const parsed = parseInt(process.env.LOG_RETENTION_DAYS ?? String(DEFAULT_LOG_RETENTION_DAYS), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_LOG_RETENTION_DAYS;
}

export const logConfig: AppLogConfig = {
  api: {
    channel: 'api',
    logFolder: resolveDefaultLogFolder(),
    callback: {
      channel: API_ERRORS_CHANNEL + '/500',
      callback: async (
        level: LogLevel,
        message: string,
        options?: LogOptions,
      ) => {
        //Send a email to admin emails

        if (!getConfigValue('app').sendErrorEmails) return;
        callback500ErrorMail(level, message, options)
      },
    },
  },
  users: {
    channel: 'users',
  },
};
