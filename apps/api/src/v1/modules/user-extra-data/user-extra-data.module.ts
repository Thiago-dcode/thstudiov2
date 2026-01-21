import { Module } from '@nestjs/common';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { PlansModule } from '../plans/plans.module';
import { UserStorageRequestModule } from '../user-storage-requests/user-storage-request.module';

@Module({
  providers: [UserExtraDataService, UserExtraDataRepository],
  exports: [UserExtraDataRepository, UserExtraDataService],
  imports: [PlansModule,UserStorageRequestModule]
})
export class UserExtraDataModule {}
