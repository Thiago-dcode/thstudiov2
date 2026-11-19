import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UserStorageRequestService } from './user-storage-request.service';
import { UserStorageRequestRepository } from './user-storage-request.repository';
import { StorageRequestProcessor } from './storage-request.processor';
import { STORAGE_REQUESTS_QUEUE } from '@repo/common-lib/constants/queues';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    BullModule.registerQueue({ name: STORAGE_REQUESTS_QUEUE }),
  ],
  providers: [
    UserStorageRequestService,
    UserStorageRequestRepository,
    StorageRequestProcessor,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'user-storage-requests',
        });
      },
    },
  ],
  exports: [UserStorageRequestService],
})
export class UserStorageRequestModule {}
