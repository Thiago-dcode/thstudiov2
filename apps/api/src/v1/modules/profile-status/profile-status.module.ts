import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { LOG_QUEUE, PROFILE_STATUS_QUEUE } from '@repo/common-lib/constants/queues';
import { ProfileStatusProcessor } from './profile-status.processor';
import { ProfileStatusRepository } from './profile-status.repository';
import { ProfileStatusService } from './profile-status.service';
import { ProfileStatusTask } from './profile-status.task';

@Module({
  imports: [
    BullModule.registerQueue({ name: PROFILE_STATUS_QUEUE }, { name: LOG_QUEUE }),
  ],
  providers: [
    ProfileStatusRepository,
    ProfileStatusService,
    ProfileStatusProcessor,
    ProfileStatusTask,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'profile-status',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  exports: [ProfileStatusService],
})
export class ProfileStatusModule {}
