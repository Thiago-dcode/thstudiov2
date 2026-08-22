import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UserStorageRequestService } from './user-storage-request.service';
import { UserStorageRequestRepository } from './user-storage-request.repository';
import { StorageRequestProcessor } from './storage-request.processor';
import {
  STORAGE_REQUESTS_QUEUE,
  LOG_QUEUE,
} from '@repo/common-lib/constants/queues';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

@Module({
  imports: [
    BullModule.registerQueue({ name: STORAGE_REQUESTS_QUEUE }, { name: LOG_QUEUE }),
  ],
  providers: [
    UserStorageRequestService,
    UserStorageRequestRepository,
    StorageRequestProcessor,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'user-storage-requests',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  exports: [UserStorageRequestService],
})
export class UserStorageRequestModule {}
