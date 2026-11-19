import { Module } from '@nestjs/common';
import { UserContactsService } from './user-contacts.service';
import { UserContactsController } from './user-contacts.controller';
import { UserContactsRepository } from './user-contacts.repository';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { BullModule } from '@nestjs/bullmq';
import { USER_CONTACTS_QUEUE } from '@repo/common-lib/constants/queues';
import { UserContactProcessor } from './user-contact.processor';
import { NewContactMail } from './mails/new-contact.mail';
import { UserModule } from '../users/users.module';
import { LogService } from '@repo/backend-lib/services/log-service';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    EmailPreferencesModule,
    UserSessionsModule,
    UserModule,
    BullModule.registerQueue({ name: USER_CONTACTS_QUEUE }),
  ],
  controllers: [UserContactsController],
  providers: [
    UserContactsService,
    UserContactsRepository,
    UserContactProcessor,
    NewContactMail,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'user-contacts',
        });
      },
    },
  ],
  // UserContactsRepository is exported for UserNotificationsModule, which reads contact previews
  // for NEW_CONTACT payloads (same pattern MediaModule uses for SitemapModule).
  exports: [UserContactsService, UserContactsRepository, NewContactMail],
})
export class UserContactsModule {}
