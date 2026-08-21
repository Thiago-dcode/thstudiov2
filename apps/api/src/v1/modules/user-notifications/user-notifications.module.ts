import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import {
  LOG_QUEUE,
  USER_NOTIFICATIONS_QUEUE,
} from '@repo/common-lib/constants/constants';
import { UserNotificationsController } from './user-notifications.controller';
import { UserNotificationsProcessor } from './user-notifications.processor';
import { UserNotificationsRepository } from './user-notifications.repository';
import { UserNotificationsService } from './user-notifications.service';
import { UserNotificationsGateway } from './user-notifications.gateway';
import { AuthCoreModule } from '../auth/auth-core.module';

@Module({
  imports: [
    AuthCoreModule,
    BullModule.registerQueue(
      { name: USER_NOTIFICATIONS_QUEUE },
      { name: LOG_QUEUE },
    ),
  ],
  controllers: [UserNotificationsController],
  providers: [
    UserNotificationsRepository,
    UserNotificationsService,
    UserNotificationsProcessor,
    UserNotificationsGateway,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'user-notifications',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  exports: [UserNotificationsService],
})
export class UserNotificationsModule { }
