import { Module } from '@nestjs/common';
import { BenefitRepository } from './benefit.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  providers: [
    BenefitRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'benefits',
        });
      },
    },
  ],
  exports: [BenefitRepository],
})
export class BenefitsModule {}
