import { Injectable } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { I18nService } from 'nestjs-i18n';
import { mailingPersonalFromEmail } from '@repo/backend-lib/config/mailling';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type WaitListValidatedMailData = {
  email: string;
  /** Example artist page behind the "this is what you'll be able to build" CTA. */
  showcaseUrl: string;
};

@Injectable()
export class WaitListValidatedMail extends ApiMailService {
  private data?: WaitListValidatedMailData;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/wait-list/validated',
      data: {},
      emailType: 'TRANSACTIONAL',
    }, i18nService);
  }

  setData(data: WaitListValidatedMailData, lang?: string) {
    const mail = new WaitListValidatedMail(this.viewService, this.emailPreferencesService!, this.i18nService!);
    mail.data = data;
    if (lang) mail.lang = lang;
    mail.viewParams = {
      viewPath: 'emails/wait-list/validated',
      data: { validated: data, translatePath: 'wait-list-validated-email' },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    const data = this.getData();

    return {
      from: `${mailingPersonalFromEmail}`,
      to: data.email,
      subject: this.t('wait-list-validated-email.SUBJECT'),
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListValidatedMail requires data before rendering.');
    }

    return this.data;
  }
}
