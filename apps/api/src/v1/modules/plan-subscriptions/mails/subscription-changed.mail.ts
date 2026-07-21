import { mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { buildRedirectToUrl } from '@repo/common-lib/constants/redirect-to';
import { ApiMailService } from 'src/common/mails/api-mail-service';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

export type SubscriptionChangedMailData = {
  newPlanName: string;
  prevPlanName: string | null;
  isUpgrade: boolean;
};

@Injectable()
export class SubscriptionChangedMail extends ApiMailService {
  private user: { email: string; username: string };
  private isUpgrade: boolean;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/plan-subscriptions/subscription-changed',
      data: {},
      emailType: 'TRANSACTIONAL',
    }, i18nService);
  }

  setData(
    user: { email: string; username: string },
    { newPlanName, prevPlanName, isUpgrade }: SubscriptionChangedMailData,
    lang?: string,
  ) {
    const mail = new SubscriptionChangedMail(
      this.viewService,
      this.emailPreferencesService!,
      this.i18nService!,
      this.configService,
    );
    mail.user = user;
    mail.isUpgrade = isUpgrade;
    if (lang) mail.lang = lang;

    mail.viewParams = {
      viewPath: 'emails/plan-subscriptions/subscription-changed',
      data: {
        user: mail.user,
        translatePath: 'subscription-changed',
        isUpgrade,
        newPlanName,
        prevPlanName,
        redirectHref: buildRedirectToUrl(
          `${this.configService.get('app.url')}/auth/login`,
          isUpgrade ? 'atelier' : 'subscriptions',
        ),
      },
      emailType: 'TRANSACTIONAL',
    };
    return mail;
  }

  protected async buildEnvelope() {
    return {
      from: `${mailingNoreplyEmail}`,
      to: this.user.email,
      subject: this.t(
        this.isUpgrade
          ? 'subscription-changed.SUBJECT_UPGRADE'
          : 'subscription-changed.SUBJECT_DOWNGRADE',
      ),
    };
  }
}
