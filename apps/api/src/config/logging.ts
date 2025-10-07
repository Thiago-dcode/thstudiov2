import path from 'path';
import {
  LogConfig,
  LogLevel,
  LogOptions,
} from '@repo/backend-lib/services/log-service/types';
import { FactoryMailService } from '@repo/backend-lib/services/mail-service/factory';
import { mailingConfig, mailingDriver } from './mailling';
import { Error500Mail } from 'src/common/mails/error-500.mail';
import { FactoryViewService } from '@repo/backend-lib/services/view-service/factory';
import { VIEW_ENGINE } from 'src/common/utils/constants';
import { viewPath } from 'src/common/utils';
import { getConfigValue } from '@repo/common-lib/config/utils';

export const LOGGIN_FOLDER = path.resolve(process.cwd(), 'storage', 'logs');
export type LogginChannels = 'api' | 'users';
export const API_ERRORS_CHANNEL = 'api/errors' as const;
export type AppLogConfig = {
  [channel in LogginChannels]: LogConfig;
};

export const logConfig: AppLogConfig = {
  api: {
    logFolder: LOGGIN_FOLDER,
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
        console.log('CALLBACK CALLED FOR ERROR 500', level, message);
        const mailService = FactoryMailService.createMailService(
          mailingDriver,
          mailingConfig,
        );
        const viewService = FactoryViewService.createViewService(VIEW_ENGINE, {
          basePath: viewPath(''),
        });
        //avoid to block the callback
        mailService.send(new Error500Mail(viewService, message, options));
      },
    },
  },
  users: {
    logFolder: LOGGIN_FOLDER,
    channel: 'users',
  },
};
