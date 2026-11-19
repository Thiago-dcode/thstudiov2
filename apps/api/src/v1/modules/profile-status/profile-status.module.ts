import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { PROFILE_STATUS_QUEUE } from '@repo/common-lib/constants/queues';
import { ProfileStatusProcessor } from './profile-status.processor';
import { ProfileStatusRepository } from './profile-status.repository';
import { ProfileStatusService } from './profile-status.service';
import { ProfileStatusTask } from './profile-status.task';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    BullModule.registerQueue({ name: PROFILE_STATUS_QUEUE }),
  ],
  providers: [
    ProfileStatusRepository,
    ProfileStatusService,
    ProfileStatusProcessor,
    ProfileStatusTask,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'profile-status',
        });
      },
    },
  ],
  exports: [ProfileStatusService],
})
export class ProfileStatusModule {}
