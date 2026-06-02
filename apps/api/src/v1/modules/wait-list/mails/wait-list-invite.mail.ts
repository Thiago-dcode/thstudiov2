import { Injectable } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { EnumType } from '@repo/common-lib/constants/enums';
import { I18nService } from 'nestjs-i18n';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type WaitListInviteMailData = {
  email: string;
  // When present, this is the validation email.
  validationUrl?: string;

  // When present, this is the registration/invitation email.
  position?: number;
  benefitType?: EnumType<'BENEFIT_TYPE'>;
  trialDays?: number;
  benefitMonths?: number;
  registrationUrl?: string;
  expiresInDays?: number;
};

@Injectable()
export class WaitListInviteMail extends ApiMailService {
  private data?: WaitListInviteMailData;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    private readonly i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/wait-list/invite',
      data: {},
      emailType: 'WAITLIST_UPDATE',
    });
  }

  setData(data: WaitListInviteMailData) {
    const mail = new WaitListInviteMail(this.viewService, this.emailPreferencesService!, this.i18nService);
    mail.data = data;
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
      from: mailingNoreplyEmail,
      to: data.email,
      subject: this.i18nService.translate('wait-list-invite-email.SUBJECT'),
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListInviteMail requires data before rendering.');
    }

    return this.data;
  }
}
