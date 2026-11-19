import { Module } from '@nestjs/common';
import { PlanPricesRepository } from './plan-prices.repository';
import { PlanPricesService } from './plan-prices.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  providers: [
    PlanPricesRepository,
    PlanPricesService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'plan-prices',
        });
      },
    },
  ],
  exports: [PlanPricesService],
})
export class PlanPricesModule {}
