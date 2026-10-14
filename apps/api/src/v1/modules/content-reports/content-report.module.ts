import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { LOG_QUEUE } from '@repo/common-lib/constants/queues';
import { Queue } from 'bullmq';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { ContentReportController } from './content-report.controller';
import { ContentReportRepository } from './content-report.repository';
import { ContentReportService } from './content-report.service';
import { ContentReportAdminMail } from './mails/content-report-admin.mail';
import { ContentReportReceivedMail } from './mails/content-report-received.mail';

/** DSA notice-and-action: the public "report content" endpoint. */
@Module({
  imports: [EmailPreferencesModule, BullModule.registerQueue({ name: LOG_QUEUE })],
  controllers: [ContentReportController],
  providers: [
    ContentReportRepository,
    ContentReportService,
    ContentReportAdminMail,
    ContentReportReceivedMail,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) =>
        FactoryLogService.createLogService('file', { channel: 'content-reports' }, logQueue),
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
})
export class ContentReportModule {}
