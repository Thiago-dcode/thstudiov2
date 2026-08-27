import { Module } from '@nestjs/common';
import { UserContactsService } from './user-contacts.service';
import { UserContactsController } from './user-contacts.controller';
import { UserContactsRepository } from './user-contacts.repository';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  USER_CONTACTS_QUEUE,
  LOG_QUEUE,
} from '@repo/common-lib/constants/queues';
import { UserContactProcessor } from './user-contact.processor';
import { NewContactMail } from './mails/new-contact.mail';
import { UserModule } from '../users/users.module';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';

@Module({
  imports: [
    EmailPreferencesModule,
    UserSessionsModule,
    UserModule,
    BullModule.registerQueue(
      { name: USER_CONTACTS_QUEUE },
      { name: LOG_QUEUE },
    ),
  ],
  controllers: [UserContactsController],
  providers: [
    UserContactsService,
    UserContactsRepository,
    UserContactProcessor,
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
  // UserContactsRepository is exported for UserNotificationsModule, which reads contact previews
  // for NEW_CONTACT payloads (same pattern MediaModule uses for SitemapModule).
  exports: [UserContactsService, UserContactsRepository, NewContactMail],
})
export class UserContactsModule {}
