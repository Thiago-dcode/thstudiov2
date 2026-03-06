import { Module } from '@nestjs/common';
import { UserContactsService } from './user-contacts.service';
import { UserContactsController } from './user-contacts.controller';
import { UserContactsRepository } from './user-contacts.repository';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';

@Module({
  imports: [UserSessionsModule],
  controllers: [UserContactsController],
  providers: [UserContactsService, UserContactsRepository],
  exports: [UserContactsService],
})
export class UserContactsModule {}
