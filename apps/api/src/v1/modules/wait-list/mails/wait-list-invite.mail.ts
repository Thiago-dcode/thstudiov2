import { Injectable } from '@nestjs/common';
import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { EnumType } from '@repo/common-lib/constants/enums';
import { I18nService } from 'nestjs-i18n';
import { mailingNoreplyEmail } from 'src/config/mailling';

export type WaitListInviteMailData = {
  email: string;
  position: number;
  benefitType: EnumType<'BENEFIT_TYPE'>;
  trialDays: number;
  benefitMonths: number;
  registrationUrl: string;
  expiresInDays: number;
};

@Injectable()
export class WaitListInviteMail extends Mailable {
  private data?: WaitListInviteMailData;

  constructor(
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
  ) {
    super();
  }

  setData(data: WaitListInviteMailData) {
    const mail = new WaitListInviteMail(this.viewService, this.i18nService);
    mail.data = data;
    return mail;
  }

  async envelope() {
    const data = this.getData();

    return {
      from: mailingNoreplyEmail,
      to: data.email,
      subject: this.i18nService.translate('wait-list-invite-email.SUBJECT'),
    };
  }

  async content() {
    const html = await this.viewService.render('emails/wait-list/invite', {
      invite: this.getData(),
      translatePath: 'wait-list-invite-email',
    });

    return {
      html,
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListInviteMail requires data before rendering.');
    }

    return this.data;
  }
}
