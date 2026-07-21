import { Injectable } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { EnumType } from '@repo/common-lib/constants/enums';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type WaitListWelcomeMailData = {
  email: string;
  position: number;
  benefitType: EnumType<'BENEFIT_TYPE'>;
  planName: string;
  trialDays: number;
  benefitMonths: number;
  registrationUrl: string;
  expiresInDays?: number;
};

@Injectable()
export class WaitListWelcomeMail extends ApiMailService {
  private data?: WaitListWelcomeMailData;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/wait-list/welcome',
      data: {},
      emailType: 'WAITLIST_UPDATE',
    }, i18nService);
  }

  setData(data: WaitListWelcomeMailData) {
    const mail = new WaitListWelcomeMail(
      this.viewService,
      this.emailPreferencesService!,
      this.i18nService!,
      this.configService,
    );
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
      from: `${mailingNoreplyEmail}`,
      to: data.email,
      subject: this.t('wait-list-welcome-email.SUBJECT', {
        args: { appName: this.configService.get('app.name').toUpperCase() },
      }),
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('WaitListWelcomeMail requires data before rendering.');
    }

    return this.data;
  }
}
