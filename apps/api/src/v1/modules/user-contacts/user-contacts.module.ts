import { Module } from '@nestjs/common';
import { UserContactsService } from './user-contacts.service';
import { UserContactsController } from './user-contacts.controller';
import { UserContactsRepository } from './user-contacts.repository';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { USER_CONTACTS_QUEUE, LOG_QUEUE } from '@repo/common-lib/constants/constants';
import { UserContactProcessor } from './user-contact.processor';
import { UserNotificationsRepository } from './user-notifications.repository';
import { NewContactMail } from './mails/new-contact.mail';
import { UserModule } from '../users/users.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

@Module({
  imports: [
    UserSessionsModule,
    UserModule,
    BullModule.registerQueue({ name: USER_CONTACTS_QUEUE }, { name: LOG_QUEUE }),
  ],
  controllers: [UserContactsController],
  providers: [
    UserContactsService,
    UserContactsRepository,
    UserContactProcessor,
    UserNotificationsRepository,
    NewContactMail,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'user-contacts',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  exports: [UserContactsService],
})
export class UserContactsModule {}
