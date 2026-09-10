import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { LOG_QUEUE, MEDIA_UPDATE_QUEUE } from '@repo/common-lib/constants/queues';
import { UserModule } from '../users/users.module';
import { MediaController } from './media.controller';
import { MediaProcessor } from './media.processor';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaRepository,
    MediaProcessor,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'media',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  // No AiModule / UserExtraDataModule: moderation and the storage-quota check both belonged to
  // the multipart `POST /media`, which compressed uploads inline. They now run in the worker,
  // against the file it pulls from S3, so nothing in this module injects either service.
  imports: [
    UserModule,
    BullModule.registerQueue({ name: MEDIA_UPDATE_QUEUE }, { name: LOG_QUEUE }),
  ],
  // MediaRepository is exported for SitemapModule, which reads the public-media predicate directly
  // (same pattern as the other feature modules the sitemap depends on).
  exports: [MediaService, MediaRepository],
})
export class MediaModule { }
