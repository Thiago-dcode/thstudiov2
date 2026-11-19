import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import { USER_NOTIFICATIONS_QUEUE } from '@repo/common-lib/constants/queues';
import { UserNotificationsController } from './user-notifications.controller';
import { UserNotificationsProcessor } from './user-notifications.processor';
import { UserNotificationsRepository } from './user-notifications.repository';
import { UserNotificationsService } from './user-notifications.service';
import { UserNotificationsGateway } from './user-notifications.gateway';
import { AuthCoreModule } from '../auth/auth-core.module';
import { MediaModule } from '../media/media.module';
import { UserContactsModule } from '../user-contacts/user-contacts.module';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  imports: [
    AuthCoreModule,
    // The entities notifications point at: their repositories back the card payloads.
    MediaModule,
    UserContactsModule,
    BullModule.registerQueue({ name: USER_NOTIFICATIONS_QUEUE }),
  ],
  controllers: [UserNotificationsController],
  providers: [
    UserNotificationsRepository,
    UserNotificationsService,
    UserNotificationsProcessor,
    UserNotificationsGateway,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'user-notifications',
        });
      },
    },
  ],
  exports: [UserNotificationsService],
})
export class UserNotificationsModule { }
