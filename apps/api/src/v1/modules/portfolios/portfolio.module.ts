import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './portfolio.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiModule } from '../ai/ai.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { CollectionModule } from '../collections/collection.module';
import { LayoutModule } from '../layouts/layout.module';
import {
  AI_QUEUE,
  USER_METRICS_QUEUE,
} from '@repo/common-lib/constants/queues';

@Module({
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    PortfolioRepository,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'portfolios',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  imports: [
    BullModule.registerQueue({ name: AI_QUEUE }, { name: USER_METRICS_QUEUE }),
    UserExtraDataModule,
    AiModule,
    CollectionModule,
    LayoutModule,
  ],
  exports: [PortfolioService, PortfolioRepository],
})
export class PortfolioModule {}

