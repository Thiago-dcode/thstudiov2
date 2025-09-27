import { Global, Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { FactoryMailService } from '@repo/backend-lib/services/mail-service/factory';
import { mailingConfig, mailingDriver } from 'src/config/mailling';
import { ConfigService } from '@nestjs/config';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { FactoryViewService } from '@repo/backend-lib/services/view-service/factory';
import { viewPath } from 'src/common/utils';
import { VIEW_ENGINE } from 'src/common/utils/constants';
import { I18nService } from 'nestjs-i18n';
import {
  FactoryLogService,
  LogService,
} from '@repo/backend-lib/services/log-service';
import { logConfig } from 'src/config/logging';
@Global()
@Module({
  exports: [RequestService, ViewService, MailService, LogService],
  providers: [
    RequestService,
    {
      provide: ViewService,
      useFactory: (configService: ConfigService, i18nService: I18nService) => {
        return FactoryViewService.createViewService(VIEW_ENGINE, {
          basePath: viewPath(''),
          globals: {
            emailsPath: viewPath('emails'),
            appName: configService.get('app.name'),
            translatePath: 'notify-new-user-email',
            beautyUrl: 'www.a11studio.com',
            appUrl: configService.get('app.url'),
            t: i18nService.translate.bind(i18nService),
          },
        });
      },
      inject: [ConfigService, I18nService],
    },
    {
      provide: MailService,
      useFactory: () => {
        return FactoryMailService.createMailService(
          mailingDriver,
          mailingConfig,
        );
      },
    },
    {
      provide: LogService,
      useFactory: () => {
        return FactoryLogService.createLogService('file', logConfig.api);
      },
    },
  ],
})
export class ServicesModule {}
