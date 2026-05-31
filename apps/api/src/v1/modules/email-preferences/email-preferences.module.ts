import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LOG_QUEUE, EMAIL_PREFERENCES_QUEUE } from '@repo/common-lib/constants/constants';
import { EmailPreferencesRepository } from './email-preferences.repository';
import { EmailPreferencesService } from './email-preferences.service';
import { EmailPreferencesProcessor } from './email-preferences.processor';
import { EmailPreferencesController } from './email-preferences.controller';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: EMAIL_PREFERENCES_QUEUE },
      { name: LOG_QUEUE },
    ),
  ],
  providers: [
    EmailPreferencesRepository,
    EmailPreferencesService,
    EmailPreferencesProcessor,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) => {
        return FactoryLogService.createLogService('file', {
          channel: 'email-preferences',
        }, logQueue);
      },
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
  controllers: [EmailPreferencesController],
  exports: [EmailPreferencesService],
})
export class EmailPreferencesModule { }
