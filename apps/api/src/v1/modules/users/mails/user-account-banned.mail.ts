import { mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

@Injectable()
export class UserAccountBannedMail extends ApiMailService {
  private user: { email: string; username: string };
  private lang: string = DEFAULT_LANGUAGE;
  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    private readonly i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/users/user-account-banned',
      data: {},
      emailType: 'TRANSACTIONAL',
    });
  }
  setUser(user: { email: string; username: string }, lang?: string) {
    this.user = user;
    if (lang) this.lang = lang;

    const t = (key: string) => this.i18nService.translate(key, { lang: this.lang });
    this.viewParams = {
      viewPath: 'emails/users/user-account-banned',
      data: { user: this.user, translatePath: 'account-banned', t },
      emailType: 'TRANSACTIONAL',
    };
    return this;
  }
  protected async buildEnvelope() {
    return {
      from: mailingNoreplyEmail,
      to: this.user.email,
      subject: this.i18nService.translate('account-banned.SUBJECT', {
        lang: this.lang,
      }),
    };
  }
}

