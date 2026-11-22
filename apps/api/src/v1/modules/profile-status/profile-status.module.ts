import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PROFILE_STATUS_QUEUE } from '@repo/common-lib/constants/queues';
import { ProfileStatusProcessor } from './profile-status.processor';
import { ProfileStatusRepository } from './profile-status.repository';
import { ProfileStatusService } from './profile-status.service';
import { ProfileStatusTask } from './profile-status.task';

@Module({
  imports: [
    BullModule.registerQueue({ name: PROFILE_STATUS_QUEUE }),
  ],
  providers: [
    ProfileStatusRepository,
    ProfileStatusService,
    ProfileStatusProcessor,
    ProfileStatusTask,
  ],
  exports: [ProfileStatusService],
})
export class ProfileStatusModule {}
