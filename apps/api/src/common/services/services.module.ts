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
import { CacheModule } from '@nestjs/cache-manager';
import {
  FactoryLogService,
  LogService,
} from '@repo/backend-lib/services/log-service';
import { logConfig } from 'src/config/logging';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import { compressConfig, s3StorageConfig } from 'src/config/storage';
import { CompressService } from '@repo/backend-lib/services/compress-service/base';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { MAIL_QUEUE, LOG_QUEUE } from '@repo/common-lib/constants/constants';
import { Queue } from 'bullmq';
import { MailProcessor } from './mail.processor';
import { LogProcessor } from './log.processor';
import KeyvRedis from '@keyv/redis';
import { Helpers } from './helpers.service';
@Global()
@Module({
  exports: [
    RequestService,
    ViewService,
    MailService,
    LogService,
    StorageService,
    CompressService,
    Helpers,
  ],
  providers: [
    RequestService,
    Helpers,
    MailProcessor,
    LogProcessor,
    {
      provide: StorageService,
      useFactory: () => {
        return FactoryStorageService.create(s3StorageConfig);
      },
    },
    {
      provide: CompressService,
      useFactory: () => {
        return FactoryCompressService.create(compressConfig);
      },
    },
    {
      provide: ViewService,
      useFactory: (configService: ConfigService, i18nService: I18nService) => {
        return FactoryViewService.createViewService(VIEW_ENGINE, {
          basePath: viewPath(''),
          globals: {
            emailsPath: viewPath('emails'),
            appName: configService.get('app.name'),
            beautyUrl: 'www.a11studio.com',
            appUrl: configService.get('app.url'),
            env: configService.get('app.env'),
            t: i18nService.translate.bind(i18nService),
          },
        });
      },
      inject: [ConfigService, I18nService],
    },
    {
      provide: MailService,
      useFactory: (mailQueue: Queue) => {
        return FactoryMailService.createMailService(
          mailingDriver,
          mailingConfig,
          mailQueue,
        );
      },
      inject: [getQueueToken(MAIL_QUEUE)],
    },
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', logConfig.api, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  imports: [
    BullModule.registerQueue({ name: MAIL_QUEUE }),
    BullModule.registerQueue({ name: LOG_QUEUE }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          stores: [new KeyvRedis(config.get('redis.url'))],
        };
      },
    }),
  ],
})
export class ServicesModule { }
