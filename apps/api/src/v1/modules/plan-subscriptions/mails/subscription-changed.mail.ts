import { mailingNoreplyEmail } from 'src/config/mailling';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
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
  private lang: string = DEFAULT_LANGUAGE;

  constructor(
    viewService: ViewService,
    emailPreferencesService: EmailPreferencesService,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {
    super(viewService, emailPreferencesService, {
      viewPath: 'emails/plan-subscriptions/subscription-changed',
      data: {},
      emailType: 'TRANSACTIONAL',
    });
  }

  setData(
    user: { email: string; username: string },
    { newPlanName, prevPlanName, isUpgrade }: SubscriptionChangedMailData,
    lang?: string,
  ) {
    this.user = user;
    this.isUpgrade = isUpgrade;
    if (lang) this.lang = lang;

    const t = (key: string) => this.i18nService.translate(key, { lang: this.lang });
    this.viewParams = {
      viewPath: 'emails/plan-subscriptions/subscription-changed',
      data: {
        user: this.user,
        translatePath: 'subscription-changed',
        t,
        isUpgrade,
        newPlanName,
        prevPlanName,
        redirectHref: buildRedirectToUrl(
          `${this.configService.get('app.url')}/auth/login`,
          'atelier',
        ),
      },
      emailType: 'TRANSACTIONAL',
    };
    return this;
  }

  protected async buildEnvelope() {
    return {
      from: mailingNoreplyEmail,
      to: this.user.email,
      subject: this.i18nService.translate(
        this.isUpgrade
          ? 'subscription-changed.SUBJECT_UPGRADE'
          : 'subscription-changed.SUBJECT_DOWNGRADE',
        { lang: this.lang },
      ),
    };
  }
}
