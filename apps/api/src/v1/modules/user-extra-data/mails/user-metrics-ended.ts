import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { mailingFrom } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';

@Injectable()
export class UserAiCreditsEndedMail extends Mailable {
  private user: { email: string; username: string };
  private lang: string = DEFAULT_LANGUAGE;
  constructor(
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
  ) {
    super();
  }
  setUser(user: { email: string; username: string }, lang?: string) {
    this.user = user;
    if (lang) this.lang = lang;
    return this;
  }
  async envelope() {
    return {
      from: mailingFrom,
      to: this.user.email,
      subject: this.i18nService.translate('ai-credits-ended.SUBJECT', {
        lang: this.lang,
      }),
    };
  }
  async content() {
    const t = (key: string) =>
      this.i18nService.translate(key, { lang: this.lang });

    const html = await this.viewService.render(
      'emails/user-extra-data/user-ai-credits-ended',
      {
        user: this.user,
        translatePath: 'ai-credits-ended',
        t,
      },
    );
    return {
      html,
    };
  }
}
