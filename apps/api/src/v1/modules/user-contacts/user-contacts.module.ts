import { Module } from '@nestjs/common';
import { UserContactsService } from './user-contacts.service';
import { UserContactsController } from './user-contacts.controller';
import { UserContactsRepository } from './user-contacts.repository';
import { UserSessionsModule } from '../user-sessions/user-sessions.module';
import { BullModule } from '@nestjs/bullmq';
import { USER_CONTACTS_QUEUE } from '@repo/common-lib/constants/constants';
import { UserContactProcessor } from './user-contact.processor';
import { UserNotificationsRepository } from './user-notifications.repository';
import { NewContactMail } from './mails/new-contact.mail';
import { UserModule } from '../users/users.module';

@Module({
  imports: [
    UserSessionsModule,
    UserModule,
    BullModule.registerQueue({ name: USER_CONTACTS_QUEUE }),
  ],
  controllers: [UserContactsController],
  providers: [
    UserContactsService,
    UserContactsRepository,
    UserContactProcessor,
    UserNotificationsRepository,
    NewContactMail,
  ],
  exports: [UserContactsService],
})
export class UserContactsModule {}
