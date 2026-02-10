import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { mailingFrom } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UserAiCreditsEndedMail extends Mailable {
  private user: { email: string; username: string };
  constructor(
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
  ) {
    super();
  }
  setUser(user: { email: string; username: string }) {
    this.user = user;
    return this;
  }
  async envelope() {
    return {
      from: mailingFrom,
      to: this.user.email,
      subject: this.i18nService.translate('ai-credits-ended.SUBJECT'),
    };
  }
  async content() {
    const html = await this.viewService.render(
      'emails/user-extra-data/user-ai-credits-ended',
      {
        user: this.user,
        translatePath: 'ai-credits-ended',
      },
    );
    return {
      html,
    };
  }
}
