import { Module } from '@nestjs/common';
import { UserSessionsRepository } from './user-sessions.repository';
import { UserSessionsService } from './user-sessions.service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  controllers: [],
  providers: [UserSessionsRepository, UserSessionsService, RequestService],
  exports: [UserSessionsService],
})
export class UserSessionsModule {}
