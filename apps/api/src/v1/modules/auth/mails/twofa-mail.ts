import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { BaseUser } from '@repo/common-lib/types/user';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TwoFAMail extends Mailable {
  private user: BaseUser & { twofa_code: string };
  constructor(
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
  ) {
    super();
  }
  setUser(user: BaseUser & { twofa_code: string }) {
    this.user = user;
    return this;
  }
  async envelope() {
    return {
      from: mailingNoreplyEmail,
      to: this.user.email,
      subject: this.i18nService.translate('twofa-email.SUBJECT'),
    };
  }
  async content() {
    const html = await this.viewService.render('emails/auth/twofa-mail', {
      user: this.user,
      translatePath: 'twofa-email',
    });
    return {
      html,
    };
  }
}
