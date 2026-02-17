import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UserStorageRequestService } from './user-storage-request.service';
import { UserStorageRequestRepository } from './user-storage-request.repository';
import { StorageRequestProcessor } from './storage-request.processor';
import { STORAGE_REQUESTS_QUEUE } from '@repo/common-lib/constants/constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: STORAGE_REQUESTS_QUEUE }),
  ],
  providers: [UserStorageRequestService, UserStorageRequestRepository, StorageRequestProcessor],
  exports: [UserStorageRequestService],
})
export class UserStorageRequestModule {}
