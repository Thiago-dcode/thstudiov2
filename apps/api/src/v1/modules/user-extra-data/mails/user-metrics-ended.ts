import { mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { buildRedirectToUrl } from '@repo/common-lib/constants/redirect-to';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

@Injectable()
export class UserAiCreditsEndedMail extends ApiMailService {
  private user: { email: string; username: string };
  private lang: string = DEFAULT_LANGUAGE;
  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/user-extra-data/user-ai-credits-ended',
      data: {},
      emailType: 'NOTIFICATION',
    });
  }
  setUser(user: { email: string; username: string }, lang?: string) {
    this.user = user;
    if (lang) this.lang = lang;

    const t = (key: string) => this.i18nService.translate(key, { lang: this.lang });
    this.viewParams = {
      viewPath: 'emails/user-extra-data/user-ai-credits-ended',
      data: {
        user: this.user,
        translatePath: 'ai-credits-ended',
        t,
        redirectHref: buildRedirectToUrl(
          `${this.configService.get('app.url')}/auth/login`,
          'subscriptions',
        ),
      },
      emailType: 'NOTIFICATION',
    };
    return this;
  }
  protected async buildEnvelope() {
    return {
      from: mailingNoreplyEmail,
      to: this.user.email,
      subject: this.i18nService.translate('ai-credits-ended.SUBJECT', {
        lang: this.lang,
      }),
    };
  }
}
