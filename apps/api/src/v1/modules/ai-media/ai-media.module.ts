import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { LOG_QUEUE, AI_MEDIA_QUEUE } from '@repo/common-lib/constants/queues';
import { AiConsumptionGuard } from 'src/common/guards/ai-consumption.guard';
import { AddressModule } from '../addresses/address.module';
import { AiModule } from '../ai/ai.module';
import { CategoriesModule } from '../categories/categories.module';
import { CollectionModule } from '../collections/collection.module';
import { MediaModule } from '../media/media.module';
import { PortfolioModule } from '../portfolios/portfolio.module';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiMediaController } from './ai-media.controller';
import { AiMediaProcessor } from './ai-media.processor';
import { AiMediaService } from './ai-media.service';

@Module({
  controllers: [AiMediaController],
  providers: [
    AiMediaService,
    AiMediaProcessor,
    AiConsumptionGuard,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'ai-media',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  // Portfolio/Collection modules are imported for their repositories only: once a media gets its SEO,
  // the portfolios and collections that display it have their SEO stamp cleared, so the nightly sweep
  // rewrites their copy from the new text.
  imports: [
    MediaModule,
    AiModule,
    AddressModule,
    UserExtraDataModule,
    CategoriesModule,
    PortfolioModule,
    CollectionModule,
    BullModule.registerQueue({ name: AI_MEDIA_QUEUE }, { name: LOG_QUEUE }),
  ],
})
export class AiMediaModule {}
