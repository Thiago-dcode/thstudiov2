import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';
import { UserModule } from '../users/users.module';
import { PortfolioModule } from '../portfolios/portfolio.module';
import { CollectionModule } from '../collections/collection.module';
import { MediaModule } from '../media/media.module';
import { ServiceModule } from '../services/service.module';

/**
 * Read-only module powering the Next.js sitemap. Reuses the repositories exported by each feature
 * module (they carry their own LogService/RequestService graph); `Helpers` (asset signing) is
 * globally provided by the common ServicesModule.
 */
@Module({
  imports: [UserModule, PortfolioModule, CollectionModule, ServiceModule, MediaModule],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}
