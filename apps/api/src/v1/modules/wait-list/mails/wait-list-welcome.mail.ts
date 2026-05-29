import { Injectable } from '@nestjs/common';
import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { EnumType } from '@repo/common-lib/constants/enums';
import { I18nService } from 'nestjs-i18n';
import { mailingNoreplyEmail } from 'src/config/mailling';

export type WaitListWelcomeMailData = {
  email: string;
  position: number;
  benefitType: EnumType<'BENEFIT_TYPE'>;
  trialDays: number;
  benefitMonths: number;
  profileUrl: string;
};

@Injectable()
export class WaitListWelcomeMail extends Mailable {
  private data?: WaitListWelcomeMailData;

  constructor(
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
  ) {
    super();
  }

  setData(data: WaitListWelcomeMailData) {
    const mail = new WaitListWelcomeMail(this.viewService, this.i18nService);
    mail.data = data;
    return mail;
  }

  async envelope() {
    const data = this.getData();

    return {
      from: mailingNoreplyEmail,
      to: data.email,
      subject: this.i18nService.translate('wait-list-welcome-email.SUBJECT'),
    };
  }

  async content() {
    const html = await this.viewService.render('emails/wait-list/welcome', {
      waitList: this.getData(),
      translatePath: 'wait-list-welcome-email',
    });

    return {
      html,
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListWelcomeMail requires data before rendering.');
    }

    return this.data;
  }
}
