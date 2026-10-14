import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/language';
import type { ContentReport } from '@repo/common-lib/types/content-report';
import { RequestService } from 'src/common/services/request.service';
import { ContentReportRepository } from './content-report.repository';
import { ContentReportAdminMail } from './mails/content-report-admin.mail';
import { ContentReportReceivedMail } from './mails/content-report-received.mail';
import { CreateContentReportRequest } from './requests/create-content-report.request';

/** `a11studio.com` and `www.a11studio.com` are the same site. */
const siteHost = (host: string) => host.toLowerCase().replace(/^www\./, '');

/**
 * Notice-and-action (EU Digital Services Act art. 16): anyone can report content they believe is
 * illegal. The notice is stored first (it must not be lost), then the admins are alerted and the
 * reporter, if they left an email, gets a confirmation of receipt. Mail is queued (`sendAsync`), so
 * a mail outage never fails or slows the request.
 */
@Injectable()
export class ContentReportService {
  constructor(
    private readonly contentReportRepository: ContentReportRepository,
    private readonly mailService: MailService,
    private readonly contentReportAdminMail: ContentReportAdminMail,
    private readonly contentReportReceivedMail: ContentReportReceivedMail,
    private readonly requestService: RequestService,
    private readonly logger: LogService,
  ) { }

  async create(request: CreateContentReportRequest): Promise<Pick<ContentReport, 'id' | 'created_at'>> {
    // Only content hosted here can be acted on; anything else is not ours to remove.
    const appHost = siteHost(new URL(getConfigValue('app').url as string).host);
    if (siteHost(new URL(request.reported_url).host) !== appHost) {
      throw new BadRequestException(`reported_url must be a page on ${appHost}`);
    }

    const report = await this.contentReportRepository.create({
      reported_url: request.reported_url,
      reason: request.reason,
      explanation: request.explanation,
      reporter_name: request.reporter_name ?? null,
      reporter_email: request.reporter_email ?? null,
    });
    this.logger.info(`Content report #${report.id} received`, {
      reason: report.reason,
      url: report.reported_url,
    });

    await this.mailService.sendAsync(this.contentReportAdminMail.setReport(report), {
      jobId: `content-report-admin-${report.id}`,
    });
    if (report.reporter_email) {
      await this.mailService.sendAsync(
        this.contentReportReceivedMail.setReport(
          report,
          this.requestService.language ?? DEFAULT_LANGUAGE,
        ),
        { jobId: `content-report-received-${report.id}` },
      );
    }

    // Never echo the stored notice back: the response is public.
    return { id: report.id, created_at: report.created_at };
  }
}
