import { BaseUser } from '@repo/common-lib/types/user';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PasswordRecoveryAttempt } from '@repo/common-lib/types/auth';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

/** Mail only needs identity fields; `User` is not assignable to `BaseUser` (flat benefit/invitation FKs). */
export type PasswordRecoveryMailUser = Pick<BaseUser, 'email' | 'username'>;

@Injectable()
export class PasswordRecoveryMail extends ApiMailService {
  private user: PasswordRecoveryMailUser;
  private passwordRecoveryAttempt: PasswordRecoveryAttempt;
  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/auth/password-recovery-mail',
      data: {},
      emailType: 'TRANSACTIONAL',
    }, i18nService);
  }
  setData(user: PasswordRecoveryMailUser, passwordRecoveryAttempt: PasswordRecoveryAttempt, lang?: string) {
    const mail = new PasswordRecoveryMail(this.viewService, this.emailPreferencesService!, this.i18nService!);
    mail.user = user;
    mail.passwordRecoveryAttempt = passwordRecoveryAttempt;
    if (lang) mail.lang = lang;

    mail.viewParams = {
      viewPath: 'emails/auth/password-recovery-mail',
      data: {
        user: mail.user,
        translatePath: 'password-recovery-mail',
        passwordRecoveryAttempt: mail.passwordRecoveryAttempt,
      },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    return {
      from: `${mailingNoreplyEmail}`,
      to: this.user.email,
      subject: this.t('password-recovery-mail.SUBJECT'),
    };
  }
}
