import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './portfolio.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';

@Module({
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioRepository],
  imports: [UserExtraDataModule],
  exports: [PortfolioService],
})
export class PortfolioModule {}

