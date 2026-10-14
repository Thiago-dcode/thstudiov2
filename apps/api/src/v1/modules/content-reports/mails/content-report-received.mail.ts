import { Injectable } from '@nestjs/common';
import { mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import type { ContentReport } from '@repo/common-lib/types/content-report';
import { I18nService } from 'nestjs-i18n';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

const VIEW_PATH = 'emails/content-reports/received';
const TRANSLATE_PATH = 'content-report-received-email';

/**
 * Confirmation of receipt to whoever filed the notice (DSA art. 16(4): "without undue delay").
 * `TRANSACTIONAL`: the reporter asked for it, so a marketing opt-out must not suppress it.
 */
@Injectable()
export class ContentReportReceivedMail extends ApiMailService {
  private report?: ContentReport;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: VIEW_PATH,
      data: {},
      emailType: 'TRANSACTIONAL',
    }, i18nService);
  }

  setReport(report: ContentReport, lang?: string) {
    const mail = new ContentReportReceivedMail(
      this.viewService,
      this.emailPreferencesService!,
      this.i18nService!,
    );
    mail.report = report;
    if (lang) mail.lang = lang;
    mail.viewParams = {
      viewPath: VIEW_PATH,
      data: {
        report: {
          id: String(report.id),
          url: report.reported_url,
          greetingName: report.reporter_name ?? '',
        },
        translatePath: TRANSLATE_PATH,
      },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    const report = this.getReport();
    return {
      from: `${mailingNoreplyEmail}`,
      to: report.reporter_email!,
      subject: this.t(`${TRANSLATE_PATH}.SUBJECT`).replace('{id}', String(report.id)),
    };
  }

  private getReport() {
    if (!this.report) throw new Error('ContentReportReceivedMail requires a report before rendering.');
    return this.report;
  }
}
