import { Global, Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { FactoryMailService } from '@repo/backend-lib/services/mail-service/factory';
import { mailingConfig, mailingDriver } from 'src/config/mailling';
import { ConfigService } from '@nestjs/config';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { FactoryViewService } from '@repo/backend-lib/services/view-service/factory';
import { displayHost, viewPath } from 'src/common/utils';
import { VIEW_ENGINE } from 'src/common/utils/constants';
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
import { LogRetentionTask } from './log-retention.task';
import KeyvRedis from '@keyv/redis';
import { Helpers } from './helpers.service';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestStore } from '@repo/common-lib/types/request';
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
    AsyncLocalStorage
  ],
  providers: [
    RequestService,
    Helpers,
    MailProcessor,
    LogProcessor,
    LogRetentionTask,
    {
      provide:AsyncLocalStorage,
      useValue: new AsyncLocalStorage<RequestStore>()
    },
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
      useFactory: (configService: ConfigService) => {
        return FactoryViewService.createViewService(VIEW_ENGINE, {
          basePath: viewPath(''),
          globals: {
            emailsPath: viewPath('emails'),
            appName: configService.get('app.name'),
            // Footer link text only (the href is appUrl). Derived from app.url rather than
            // hardcoded: it read `www.a11studio.com`, a host the proxy served no vhost for,
            // so every email advertised a hostname that answered with a TLS error.
            beautyUrl: displayHost(configService.get<string>('app.url')),
            appUrl: configService.get('app.url'),
            env: configService.get('app.env'),
            // Do NOT put unbound i18n here — ApiMailService injects the
            // lang-bound `t` per email. Leaving a default would silently
            // fall back to EN when templates call globals.t.
          },
        });
      },
      inject: [ConfigService],
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
      useFactory: (logQueue: Queue, requestService: RequestService) => {
        // Derive a config instead of assigning onto the shared `logConfig.api` singleton.
        return FactoryLogService.createLogService(
          'file',
          { ...logConfig.api, id: () => requestService.requestId },
          logQueue,
        );
      },
      inject: [getQueueToken(LOG_QUEUE), RequestService],
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
