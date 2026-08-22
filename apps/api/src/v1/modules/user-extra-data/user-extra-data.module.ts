import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { UserExtraDataProcessor } from './user-extra-data.processor';
import { PlansModule } from '../plans/plans.module';
import { UserStorageRequestModule } from '../user-storage-requests/user-storage-request.module';
import {
  USER_METRICS_QUEUE,
  LOG_QUEUE,
} from '@repo/common-lib/constants/queues';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

@Module({
  imports: [
    BullModule.registerQueue({ name: USER_METRICS_QUEUE }, { name: LOG_QUEUE }),
    PlansModule,
    UserStorageRequestModule,
  ],
  providers: [
    UserExtraDataService,
    UserExtraDataRepository,
    UserExtraDataProcessor,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'user-extra-data',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  exports: [UserExtraDataRepository, UserExtraDataService],
})
export class UserExtraDataModule {}
