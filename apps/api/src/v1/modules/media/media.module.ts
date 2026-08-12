import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaRepository } from './media.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { UserModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaRepository,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'media',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  imports: [UserExtraDataModule, UserModule, AiModule],
  // MediaRepository is exported for SitemapModule, which reads the public-media predicate directly
  // (same pattern as the other feature modules the sitemap depends on).
  exports: [MediaService, MediaRepository],
})
export class MediaModule { }
