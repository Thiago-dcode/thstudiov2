import { Module } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { ProfileStatusRepository } from './profile-status.repository';
import { ProfileStatusService } from './profile-status.service';
import { ProfileStatusTask } from './profile-status.task';

@Module({
  providers: [
    ProfileStatusRepository,
    ProfileStatusService,
    ProfileStatusTask,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'profile-status',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [ProfileStatusService],
})
export class ProfileStatusModule {}
