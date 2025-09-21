import {
  LogginServiceType,
  LogginConfig,
} from '@repo/backend-lib/services/logginService/types';
import path from 'path';

export const LOGGIN_FOLDER = path.resolve(process.cwd(), 'storage', 'logs');
export type LogginChannels = 'app' | 'users';

export type AppLogginConfig = {
  [channel in LogginChannels]: {
    type: LogginServiceType;
    config: LogginConfig;
  };
};

export const logginConfig: AppLogginConfig = {
  app: {
    type: 'file',
    config: {
      logginFolder: LOGGIN_FOLDER,
      channel: 'app',
    },
  },
  users: {
    type: 'file',
    config: {
      logginFolder: LOGGIN_FOLDER,
      channel: 'users',
    },
  },
};
