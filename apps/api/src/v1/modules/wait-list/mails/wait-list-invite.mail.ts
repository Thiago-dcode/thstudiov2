import { Injectable } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { I18nService } from 'nestjs-i18n';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type WaitListInviteMailData = {
  email: string;
  validationUrl: string;
};

@Injectable()
export class WaitListInviteMail extends ApiMailService {
  private data?: WaitListInviteMailData;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/wait-list/invite',
      data: {},
      emailType: 'WAITLIST_UPDATE',
    }, i18nService);
  }

  setData(data: WaitListInviteMailData, lang?: string) {
    const mail = new WaitListInviteMail(this.viewService, this.emailPreferencesService!, this.i18nService!);
    mail.data = data;
    if (lang) mail.lang = lang;
    mail.viewParams = {
      viewPath: 'emails/wait-list/invite',
      data: { invite: data, translatePath: 'wait-list-invite-email' },
      emailType: 'WAITLIST_UPDATE',
    };
    return mail;
  }

  protected async buildEnvelope() {
    const data = this.getData();

    return {
      from: `${mailingNoreplyEmail}`,
      to: data.email,
      subject: this.t('wait-list-invite-email.SUBJECT'),
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListInviteMail requires data before rendering.');
    }

    return this.data;
  }
}
