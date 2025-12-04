import { Module } from '@nestjs/common';
import { PlanPricesRepository } from './plan-prices.repository';
import { PlanPricesService } from './plan-prices.service';

@Module({
  providers: [PlanPricesRepository, PlanPricesService],
  exports: [PlanPricesService],
})
export class PlanPricesModule {}
