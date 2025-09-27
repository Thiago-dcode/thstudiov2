import path from 'path';
import { LogConfig } from '@repo/backend-lib/services/log-service/types';

export const LOGGIN_FOLDER = path.resolve(process.cwd(), 'storage', 'logs');
export type LogginChannels = 'api' | 'users';

export type AppLogConfig = {
  [channel in LogginChannels]: LogConfig;
};

export const logConfig: AppLogConfig = {
  api: {
    logFolder: LOGGIN_FOLDER,
    channel: 'api',
  },
  users: {
    logFolder: LOGGIN_FOLDER,
    channel: 'users',
  },
};
