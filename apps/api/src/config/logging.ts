import {
  LogConfig,
  LogLevel,
  LogOptions,
} from '@repo/backend-lib/services/log-service/types';
import { getConfigValue } from '@repo/common-lib/config/utils';
import {Helpers} from 'src/common/services/helpers.service';


export type LogginChannels = 'api' | 'users';
export const API_ERRORS_CHANNEL = 'api/errors' as const;
export type AppLogConfig = {
  [channel in LogginChannels]: LogConfig;
};

export const logConfig: AppLogConfig = {
  api: {
    channel: 'api',
    callback: {
      channel: API_ERRORS_CHANNEL + '/500',
      callback: async (
        level: LogLevel,
        message: string,
        options?: LogOptions,
      ) => {
        //Send a email to admin emails

        if (!getConfigValue('app').sendErrorEmails) return;
       Helpers.callback500ErrorMail(level,message,options)
      },
    },
  },
  users: {
    channel: 'users',
  },
};
