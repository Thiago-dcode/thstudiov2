import { Injectable } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { EnumType } from '@repo/common-lib/constants/enums';
import { I18nService } from 'nestjs-i18n';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type WaitListWelcomeMailData = {
  email: string;
  position: number;
  benefitType: EnumType<'BENEFIT_TYPE'>;
  trialDays: number;
  benefitMonths: number;
  profileUrl: string;
};

@Injectable()
export class WaitListWelcomeMail extends ApiMailService {
  private data?: WaitListWelcomeMailData;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    private readonly i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/wait-list/welcome',
      data: {},
      emailType: 'WAITLIST_UPDATE',
    });
  }

  setData(data: WaitListWelcomeMailData) {
    const mail = new WaitListWelcomeMail(this.viewService, this.emailPreferencesService!, this.i18nService);
    mail.data = data;
    mail.viewParams = {
      viewPath: 'emails/wait-list/welcome',
      data: { waitList: data, translatePath: 'wait-list-welcome-email' },
      emailType: 'WAITLIST_UPDATE',
    };
    return mail;
  }

  protected async buildEnvelope() {
    const data = this.getData();

    return {
      from: mailingNoreplyEmail,
      to: data.email,
      subject: this.i18nService.translate('wait-list-welcome-email.SUBJECT'),
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListWelcomeMail requires data before rendering.');
    }

    return this.data;
  }
}
