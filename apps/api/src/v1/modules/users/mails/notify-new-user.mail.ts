import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { BaseUser } from '@repo/common-lib/types/user';
import { mailingFrom } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotifyNewUserMail extends Mailable {
  private user: BaseUser;
  constructor(
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super();
  }
  setUser(user: BaseUser) {
    this.user = user;
    return this;
  }
  async envelope() {
    return {
      from: mailingFrom,
      to: this.user.email,
      subject: this.i18nService.translate(
        'notify-new-user-email.WELCOME_SUBJECT',
        { args: { appName: this.configService.get('app.name') } },
      ),
    };
  }
  async content() {
    const t = this.i18nService.translate.bind(this.i18nService);
    const features = [
      t('notify-new-user-email.FEATURES.0'),
      t('notify-new-user-email.FEATURES.1'),
      t('notify-new-user-email.FEATURES.2'),
      t('notify-new-user-email.FEATURES.3'),
      t('notify-new-user-email.FEATURES.4'),
      t('notify-new-user-email.FEATURES.5'),
    ];
    const html = await this.viewService.render('emails/users/notify-new-user', {
      user: this.user,
      features,
      translatePath: 'notify-new-user-email',
    });
    return {
      html,
    };
  }
}
