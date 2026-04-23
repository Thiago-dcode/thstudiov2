import { Module } from '@nestjs/common';
import { UserSessionsRepository } from './user-sessions.repository';
import { UserSessionsService } from './user-sessions.service';
import { RequestService } from 'src/common/services/request.service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

@Module({
  controllers: [],
  providers: [
    UserSessionsRepository,
    UserSessionsService,
    RequestService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'user-sessions',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [UserSessionsService],
})
export class UserSessionsModule {}
