import { BaseUser } from '@repo/common-lib/types/user';
import { mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

@Injectable()
export class TwoFAMail extends ApiMailService {
  private user: BaseUser & { twofa_code: string };
  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/auth/twofa-mail',
      data: {},
      emailType: 'TRANSACTIONAL',
    }, i18nService);
  }
  setUser(user: BaseUser & { twofa_code: string }, lang?: string) {
    const mail = new TwoFAMail(this.viewService, this.emailPreferencesService!, this.i18nService!);
    mail.user = user;
    if (lang) mail.lang = lang;

    mail.viewParams = {
      viewPath: 'emails/auth/twofa-mail',
      data: { user: mail.user, translatePath: 'twofa-email' },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }
  protected async buildEnvelope() {
    return {
      from: `${mailingNoreplyEmail}`,
      to: this.user.email,
      subject: this.t('twofa-email.SUBJECT'),
    };
  }
}
