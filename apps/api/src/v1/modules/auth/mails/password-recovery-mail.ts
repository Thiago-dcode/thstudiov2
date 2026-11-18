import { UserSchema } from '@repo/common-lib/schemas/user';
import { mailingNoreplyEmail } from '@repo/backend-lib/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PasswordRecoveryAttempt } from '@repo/common-lib/types/auth';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';
import { mailGreetingName } from 'src/common/mails/greeting-name';

/** The recipient and the greeting name; `name` is a profile field a core `BaseUser` lacks. */
export type PasswordRecoveryMailUser = Pick<UserSchema, 'email' | 'name'>;

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
        greetingName: mailGreetingName(mail.user),
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
