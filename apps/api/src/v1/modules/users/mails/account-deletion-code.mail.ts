import { mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';
import { mailGreetingName } from 'src/common/mails/greeting-name';

export type AccountDeletionCodeMailData = {
  email: string;
  name: string | null;
  code: string;
};

const VIEW_PATH = 'emails/users/account-deletion-code';

/** The code that confirms "delete my account". `TRANSACTIONAL`: an opt-out never silences it. */
@Injectable()
export class AccountDeletionCodeMail extends ApiMailService {
  private data?: AccountDeletionCodeMailData;

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

  setData(data: AccountDeletionCodeMailData, lang?: string) {
    const mail = new AccountDeletionCodeMail(
      this.viewService,
      this.emailPreferencesService!,
      this.i18nService!,
    );
    mail.data = data;
    if (lang) mail.lang = lang;
    mail.viewParams = {
      viewPath: VIEW_PATH,
      data: {
        code: data.code,
        greetingName: mailGreetingName(data),
        translatePath: 'account-deletion-code-email',
      },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    if (!this.data) {
      throw new Error('AccountDeletionCodeMail requires data before rendering.');
    }
    return {
      from: `${mailingNoreplyEmail}`,
      to: this.data.email,
      subject: this.t('account-deletion-code-email.SUBJECT'),
    };
  }
}
