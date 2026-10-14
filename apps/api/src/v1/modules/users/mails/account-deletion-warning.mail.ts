import { mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type AccountDeletionWarningMailData = {
  email: string;
  username: string;
  /** Already formatted for the recipient's language. */
  deletionDate: string;
  /** Login, then the atelier's "reopen my account" modal. */
  reactivateUrl: string;
};

const VIEW_PATH = 'emails/users/account-deletion-warning';

/**
 * "Your account will be deleted on {date}": sent once, two days before the hard delete.
 * `TRANSACTIONAL` because it is a notice about the recipient's own account, so a marketing opt-out
 * never silences it.
 */
@Injectable()
export class AccountDeletionWarningMail extends ApiMailService {
  private data?: AccountDeletionWarningMailData;

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

  setData(data: AccountDeletionWarningMailData, lang?: string) {
    const mail = new AccountDeletionWarningMail(
      this.viewService,
      this.emailPreferencesService!,
      this.i18nService!,
    );
    mail.data = data;
    if (lang) mail.lang = lang;
    mail.viewParams = {
      viewPath: VIEW_PATH,
      data: { warning: data, translatePath: 'account-deletion-warning-email' },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    const data = this.getData();
    return {
      from: `${mailingNoreplyEmail}`,
      to: data.email,
      subject: this.t('account-deletion-warning-email.SUBJECT').replace('{date}', data.deletionDate),
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('AccountDeletionWarningMail requires data before rendering.');
    }
    return this.data;
  }
}
