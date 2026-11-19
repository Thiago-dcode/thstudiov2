import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { PlansRepository } from './plans.repository';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [PlansController],
  providers: [
    PlansService,
    PlansRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'plans',
        });
      },
    },
  ],
  exports: [PlansService],
})
export class PlansModule {}
