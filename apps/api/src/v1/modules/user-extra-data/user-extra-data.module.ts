import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UserExtraDataService } from './user-extra-data.service';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { UserExtraDataProcessor } from './user-extra-data.processor';
import { PlansModule } from '../plans/plans.module';
import { UserStorageRequestModule } from '../user-storage-requests/user-storage-request.module';
import { USER_METRICS_QUEUE } from '@repo/common-lib/constants/queues';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    BullModule.registerQueue({ name: USER_METRICS_QUEUE }),
    PlansModule,
    UserStorageRequestModule,
  ],
  providers: [
    UserExtraDataService,
    UserExtraDataRepository,
    UserExtraDataProcessor,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'user-extra-data',
        });
      },
    },
  ],
  exports: [UserExtraDataRepository, UserExtraDataService],
})
export class UserExtraDataModule {}
