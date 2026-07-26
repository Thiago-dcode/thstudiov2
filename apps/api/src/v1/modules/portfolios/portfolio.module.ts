import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './portfolio.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiModule } from '../ai/ai.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { CollectionModule } from '../collections/collection.module';
import { LayoutModule } from '../layouts/layout.module';

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
  imports: [UserExtraDataModule, AiModule, CollectionModule, LayoutModule],
  exports: [PortfolioService, PortfolioRepository],
})
export class PortfolioModule {}

