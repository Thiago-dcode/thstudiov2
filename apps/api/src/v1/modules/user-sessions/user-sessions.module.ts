import { Module } from '@nestjs/common';
import { UserSessionsRepository } from './user-sessions.repository';
import { UserSessionsService } from './user-sessions.service';
import { RequestService } from 'src/common/services/request.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [],
  providers: [
    UserSessionsRepository,
    UserSessionsService,
    RequestService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'user-sessions',
        });
      },
    },
  ],
  exports: [UserSessionsService],
})
export class UserSessionsModule {}
