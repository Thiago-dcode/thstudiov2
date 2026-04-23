import { Module } from '@nestjs/common';
import { PlanPricesRepository } from './plan-prices.repository';
import { PlanPricesService } from './plan-prices.service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  providers: [
    PlanPricesRepository,
    PlanPricesService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'plan-prices',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [PlanPricesService],
})
export class PlanPricesModule {}
