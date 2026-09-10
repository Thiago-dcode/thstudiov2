import { Injectable } from '@nestjs/common';
import { mailingAdmins, mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { ApiMailService } from 'src/common/mails/api-mail-service';

export type WaitListAdminNotificationMailData = {
  email: string;
  entryId: number;
  language: string;
};

/**
 * Internal ops alert fired alongside the user's wait-list validation email.
 *
 * Deliberately not translated and not preference-gated (same shape as `Error500Mail`):
 * it goes to `ADMIN_EMAILS`, never to a subscriber, so an admin's `waitlist_updates`
 * preference must not be able to silence it. `emailType: 'TRANSACTIONAL'` keeps it out
 * of the unsubscribe flow entirely.
 */
@Injectable()
export class WaitListAdminNotificationMail extends ApiMailService {
  private data?: WaitListAdminNotificationMailData;

  constructor(viewService: ViewService) {
    super(viewService, undefined, {
      viewPath: 'emails/wait-list/admin-notification',
      data: {},
      emailType: 'TRANSACTIONAL',
    });
  }

  setData(data: WaitListAdminNotificationMailData) {
    const mail = new WaitListAdminNotificationMail(this.viewService);
    mail.data = data;
    mail.viewParams = {
      viewPath: 'emails/wait-list/admin-notification',
      data: {
        signup: [
          { label: 'Email', value: data.email },
          { label: 'Entry ID', value: String(data.entryId) },
          { label: 'Language', value: data.language },
          { label: 'Signed up at', value: new Date().toISOString() },
        ],
      },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    const data = this.getData();

    return {
      from: `${mailingNoreplyEmail}`,
      to: mailingAdmins,
      subject: `New wait-list signup: ${data.email}`,
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListAdminNotificationMail requires data before rendering.');
    }

    return this.data;
  }
}
