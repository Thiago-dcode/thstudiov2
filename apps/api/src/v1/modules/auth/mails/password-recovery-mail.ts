import { Mailable } from '@repo/backend-lib/services/mail-service/base';
import { BaseUser } from '@repo/common-lib/types/user';
import { mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { PasswordRecoveryAttempt } from '@repo/common-lib/types/auth';

/** Mail only needs identity fields; `User` is not assignable to `BaseUser` (flat benefit/invitation FKs). */
export type PasswordRecoveryMailUser = Pick<BaseUser, 'email' | 'username'>;

@Injectable()
export class PasswordRecoveryMail extends Mailable {
  private user: PasswordRecoveryMailUser;
  private passwordRecoveryAttempt: PasswordRecoveryAttempt;
  constructor(
    private readonly viewService: ViewService,
    private readonly i18nService: I18nService,
  ) {
    super();
  }
  setData(user: PasswordRecoveryMailUser, passwordRecoveryAttempt: PasswordRecoveryAttempt) {
    this.user = user;
    this.passwordRecoveryAttempt = passwordRecoveryAttempt;
    return this;
  }
  async envelope() {
    return {
      from: mailingNoreplyEmail,
      to: this.user.email,
      subject: this.i18nService.translate('password-recovery-mail.SUBJECT'),
    };
  }
  async content() {
    const html = await this.viewService.render('emails/auth/password-recovery-mail', {
      user: this.user,
      translatePath: 'password-recovery-mail',
      passwordRecoveryAttempt: this.passwordRecoveryAttempt,
    });
    return {
      html,
    };
  }
}
