import { Module } from '@nestjs/common';
import { AiMediaController } from './ai-media.controller';
import { AiMediaService } from './ai-media.service';
import { MediaModule } from '../media/media.module';
import { AiModule } from '../ai/ai.module';
import { AddressModule } from '../addresses/address.module';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { CategoriesModule } from '../categories/categories.module';
import { PortfolioModule } from '../portfolios/portfolio.module';
import { CollectionModule } from '../collections/collection.module';
import { AiConsumptionGuard } from 'src/common/guards/ai-consumption.guard';

@Module({
  controllers: [AiMediaController],
  providers: [AiMediaService, AiConsumptionGuard],
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
  ],
})
export class AiMediaModule {}
