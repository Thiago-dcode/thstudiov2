import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceRepository } from './service.repository';
import { UserExtraDataModule } from '../user-extra-data/user-extra-data.module';
import { AiModule } from '../ai/ai.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import {
  AI_QUEUE,
  USER_METRICS_QUEUE,
} from '@repo/common-lib/constants/queues';

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
  imports: [BullModule.registerQueue({ name: AI_QUEUE }, { name: USER_METRICS_QUEUE }), UserExtraDataModule, AiModule],
  exports: [ServiceService, ServiceRepository],
})
export class ServiceModule {}
