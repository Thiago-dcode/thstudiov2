import { mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { buildRedirectToUrl } from '@repo/common-lib/constants/redirect-to';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

@Injectable()
export class UserAiCreditsEndedMail extends ApiMailService {
  private user: { email: string; username: string };
  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/user-extra-data/user-ai-credits-ended',
      data: {},
      emailType: 'NOTIFICATION',
    }, i18nService);
  }
  setUser(user: { email: string; username: string }, lang?: string) {
    const mail = new UserAiCreditsEndedMail(
      this.viewService,
      this.emailPreferencesService!,
      this.i18nService!,
      this.configService,
    );
    mail.user = user;
    if (lang) mail.lang = lang;

    mail.viewParams = {
      viewPath: 'emails/user-extra-data/user-ai-credits-ended',
      data: {
        user: mail.user,
        translatePath: 'ai-credits-ended',
        redirectHref: buildRedirectToUrl(
          `${this.configService.get('app.url')}/auth/login`,
          'subscriptions',
        ),
      },
      emailType: 'NOTIFICATION',
    };
    return mail;
  }
  protected async buildEnvelope() {
    return {
      from: `${mailingNoreplyEmail}`,
      to: this.user.email,
      subject: this.t('ai-credits-ended.SUBJECT'),
    };
  }
}
