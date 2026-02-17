import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { UserExtraDataProcessor } from './user-extra-data.processor';
import { PlansModule } from '../plans/plans.module';
import { UserStorageRequestModule } from '../user-storage-requests/user-storage-request.module';
import { USER_METRICS_QUEUE } from '@repo/common-lib/constants/constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: USER_METRICS_QUEUE }),
    PlansModule,
    UserStorageRequestModule,
  ],
  providers: [UserExtraDataService, UserExtraDataRepository, UserExtraDataProcessor],
  exports: [UserExtraDataRepository, UserExtraDataService],
})
export class UserExtraDataModule {}
