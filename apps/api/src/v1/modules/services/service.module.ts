import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceRepository } from './service.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiModule } from '../ai/ai.module';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [ServiceController],
  providers: [
    ServiceService,
    ServiceRepository,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'services',
        });
      },
    },
  ],
  imports: [UserExtraDataModule, AiModule],
  exports: [ServiceService, ServiceRepository],
})
export class ServiceModule {}
