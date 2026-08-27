import { mailingContactEmail, mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

@Injectable()
export class UserAccountBannedMail extends ApiMailService {
  private user: { email: string; username: string };
  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/users/user-account-banned',
      data: {},
      emailType: 'TRANSACTIONAL',
    }, i18nService);
  }
  setUser(user: { email: string; username: string }, lang?: string) {
    const mail = new UserAccountBannedMail(this.viewService, this.emailPreferencesService!, this.i18nService!);
    mail.user = user;
    if (lang) mail.lang = lang;

    mail.viewParams = {
      viewPath: 'emails/users/user-account-banned',
      data: { user: mail.user, translatePath: 'account-banned', supportEmail: mailingContactEmail },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }
  protected async buildEnvelope() {
    return {
      from: `${mailingNoreplyEmail}`,
      to: this.user.email,
      subject: this.t('account-banned.SUBJECT'),
    };
  }
}

