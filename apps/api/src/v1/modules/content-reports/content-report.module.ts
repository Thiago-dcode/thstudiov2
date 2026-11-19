import { Module } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { ContentReportController } from './content-report.controller';
import { ContentReportRepository } from './content-report.repository';
import { ContentReportService } from './content-report.service';
import { ContentReportAdminMail } from './mails/content-report-admin.mail';
import { ContentReportReceivedMail } from './mails/content-report-received.mail';
import { createApiLogger } from 'src/common/utils/api-logger';

/** DSA notice-and-action: the public "report content" endpoint. */
@Module({
  imports: [EmailPreferencesModule],
  controllers: [ContentReportController],
  providers: [
    ContentReportRepository,
    ContentReportService,
    ContentReportAdminMail,
    ContentReportReceivedMail,
    {
      provide: LogService,
      useFactory: () => createApiLogger({ channel: 'content-reports' }),
    },
  ],
})
export class ContentReportModule {}
