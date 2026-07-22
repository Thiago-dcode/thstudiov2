import { Injectable } from '@nestjs/common';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { EnumType } from '@repo/common-lib/constants/enums';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type InvitationLinkMailData = {
  email: string;
  benefitType: EnumType<'BENEFIT_TYPE'>;
  trialDays: number;
  benefitMonths: number;
  registrationUrl: string;
  expiresInDays?: number;
};

@Injectable()
export class InvitationLinkMail extends ApiMailService {
  private data?: InvitationLinkMailData;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/invitation-links/invitation-link',
      data: {},
      emailType: 'TRANSACTIONAL',
    }, i18nService);
  }

  setData(data: InvitationLinkMailData, lang?: string) {
    const mail = new InvitationLinkMail(
      this.viewService,
      this.emailPreferencesService!,
      this.i18nService!,
      this.configService,
    );
    mail.data = data;
    if (lang) mail.lang = lang;
    mail.viewParams = {
      viewPath: 'emails/invitation-links/invitation-link',
      data: { invitation: data, translatePath: 'invitation-link-email' },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    const data = this.getData();

    return {
      from: `${mailingNoreplyEmail}`,
      to: data.email,
      subject: this.t('invitation-link-email.SUBJECT', {
        args: { appName: this.configService.get('app.name').toUpperCase() },
      }),
    };
  }

  private getData() {
    if (!this.data) {
      throw new Error('InvitationLinkMail requires data before rendering.');
    }

    return this.data;
  }
}
