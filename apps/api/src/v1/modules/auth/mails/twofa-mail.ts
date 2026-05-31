import { BaseUser } from '@repo/common-lib/types/user';
import { mailingNoreplyEmail } from 'src/config/mailling';
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
    private readonly i18nService: I18nService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/auth/twofa-mail',
      data: {},
      emailType: 'TRANSACTIONAL',
    });
  }
  setUser(user: BaseUser & { twofa_code: string }) {
    this.user = user;

    this.viewParams = {
      viewPath: 'emails/auth/twofa-mail',
      data: { user: this.user, translatePath: 'twofa-email' },
      emailType: 'TRANSACTIONAL',
    };
    return this;
  }
  protected async buildEnvelope() {
    return {
      from: mailingNoreplyEmail,
      to: this.user.email,
      subject: this.i18nService.translate('twofa-email.SUBJECT'),
    };
  }
}
