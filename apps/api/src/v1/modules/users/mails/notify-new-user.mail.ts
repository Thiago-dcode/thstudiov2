import { BaseUser, User } from '@repo/common-lib/types/user';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

@Injectable()
export class NotifyNewUserMail extends ApiMailService {
  private user: BaseUser | User;
  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/users/notify-new-user',
      data: {},
      emailType: 'TRANSACTIONAL',
    });
  }
  setUser(user: BaseUser | User) {
    this.user = user;

    const t = this.i18nService.translate.bind(this.i18nService);
    const features = [
      t('notify-new-user-email.FEATURES.0'),
      t('notify-new-user-email.FEATURES.1'),
      t('notify-new-user-email.FEATURES.2'),
      t('notify-new-user-email.FEATURES.3'),
      t('notify-new-user-email.FEATURES.4'),
      t('notify-new-user-email.FEATURES.5'),
    ];

    this.viewParams = {
      viewPath: 'emails/users/notify-new-user',
      data: { user: this.user, features, translatePath: 'notify-new-user-email' },
      emailType: 'TRANSACTIONAL',
    };
    return this;
  }

  protected async buildEnvelope() {
    return {
      from: mailingNoreplyEmail,
      to: this.user.email,
      subject: this.i18nService.translate(
        'notify-new-user-email.WELCOME_SUBJECT',
        { args: { appName: this.configService.get('app.name') } },
      ),
    };
  }
}
