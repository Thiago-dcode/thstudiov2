import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './portfolio.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiModule } from '../ai/ai.module';
import { LogService } from '@repo/backend-lib/services/log-service';
import { CollectionModule } from '../collections/collection.module';
import { LayoutModule } from '../layouts/layout.module';
import { AuthCoreModule } from '../auth/auth-core.module';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [PortfolioController],
  providers: [
    PortfolioService,
    PortfolioRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'portfolios',
        });
      },
    },
  ],
  imports: [
    UserExtraDataModule,
    AiModule,
    CollectionModule,
    LayoutModule,
    // `PublicViewerService`, so owners still see their hidden portfolios.
    AuthCoreModule,
  ],
  exports: [PortfolioService, PortfolioRepository],
})
export class PortfolioModule {}
