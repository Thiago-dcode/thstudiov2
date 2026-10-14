import { Injectable } from '@nestjs/common';
import { mailingAdmins, mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import type { ContentReport } from '@repo/common-lib/types/content-report';
import { ApiMailService } from 'src/common/mails/api-mail-service';

const VIEW_PATH = 'emails/content-reports/admin-notification';

/**
 * Internal alert for a new illegal-content notice (DSA art. 16): the review has to start promptly.
 * Untranslated and not preference-gated, like the other admin alerts: it goes to `ADMIN_EMAILS`.
 * Values are rendered with `<%= %>`, so the reporter's free text is HTML-escaped.
 */
@Injectable()
export class ContentReportAdminMail extends ApiMailService {
  private report?: ContentReport;

  constructor(viewService: ViewService) {
    super(viewService, undefined, { viewPath: VIEW_PATH, data: {}, emailType: 'TRANSACTIONAL' });
  }

  setReport(report: ContentReport) {
    const mail = new ContentReportAdminMail(this.viewService);
    mail.report = report;
    mail.viewParams = {
      viewPath: VIEW_PATH,
      data: {
        heading: 'New content report',
        rows: [
          { label: 'Reference', value: `#${report.id}` },
          { label: 'Reason', value: report.reason },
          { label: 'URL', value: report.reported_url },
          { label: 'Explanation', value: report.explanation },
          { label: 'Reporter', value: report.reporter_name ?? '(not given)' },
          { label: 'Reporter email', value: report.reporter_email ?? '(not given)' },
          { label: 'Received at', value: new Date(report.created_at).toISOString() },
        ],
        note: 'DSA notice: review it promptly, act on the content if it is illegal or breaks the Terms, and email the decision to the reporter (if they left an email) and a statement of reasons to the affected artist.',
      },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    const report = this.getReport();
    return {
      from: `${mailingNoreplyEmail}`,
      to: mailingAdmins,
      subject: `Content report #${report.id}: ${report.reason}`,
    };
  }

  private getReport() {
    if (!this.report) throw new Error('ContentReportAdminMail requires a report before rendering.');
    return this.report;
  }
}
