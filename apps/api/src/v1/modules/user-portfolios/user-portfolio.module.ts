import { Module } from '@nestjs/common';

import { UserPortfolioService } from './user-portfolio.service';
import { UserRepository } from '../users/users.repository';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { UserPortfolioController } from './user-portfolio.controller';
import { CollectionModule } from '../collections/collection.module';
import { AuthCoreModule } from '../auth/auth-core.module';

@Module({
  controllers: [UserPortfolioController],
  providers: [UserPortfolioService, UserRepository, PortfolioRepository],
  // AuthCoreModule: `PublicArtistGuard` resolves the owner's token on hidden accounts.
  imports:[CollectionModule, AuthCoreModule]
})
export class UserPortfolioModule {}

