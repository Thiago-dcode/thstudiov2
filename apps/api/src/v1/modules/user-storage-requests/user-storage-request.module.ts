import { Module } from '@nestjs/common';
import { UserStorageRequestService } from './user-storage-request.service';
import { UserStorageRequestRepository } from './user-storage-request.repository';

@Module({
  providers: [UserStorageRequestService, UserStorageRequestRepository],
  exports: [UserStorageRequestService],
})
export class UserStorageRequestModule {}
