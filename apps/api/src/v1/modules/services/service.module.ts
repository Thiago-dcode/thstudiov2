import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceRepository } from './service.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiModule } from '../ai/ai.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  controllers: [ServiceController],
  providers: [
    ServiceService,
    ServiceRepository,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'services',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  imports: [UserExtraDataModule, AiModule],
  exports: [ServiceService, ServiceRepository],
})
export class ServiceModule {}
