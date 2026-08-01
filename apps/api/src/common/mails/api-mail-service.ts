import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Content, Envelop, Mailable } from '@repo/backend-lib/services/mail-service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { ViewData } from '@repo/backend-lib/services/view-service/types';
import { EnumType } from '@repo/common-lib/constants/enums';
import { DEFAULT_LANGUAGE } from '@repo/common-lib/constants/constants';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

type ViewParams = {
  viewPath: string;
  data: ViewData;
  emailType: EnumType<'EMAIL_TYPE'>;
};

@Injectable()
export abstract class ApiMailService extends Mailable {
  /** Own instance (not DI-shared) so its `email` channel never gets mutated by other consumers. */
  private static readonly emailLog: LogService = FactoryLogService.createLogService('file', {
    channel: 'email',
  });

  private envelopePromise: Promise<Envelop> | null = null;
  /** Set by subclasses (via `this.lang = lang`) before `envelope()`/`content()` run. */
  protected lang: string = DEFAULT_LANGUAGE;

  constructor(
    protected readonly viewService: ViewService,
    protected readonly emailPreferencesService: EmailPreferencesService | undefined,
    protected _viewParams: ViewParams,
    /** Required for translated emails — ApiMailService injects lang-bound `t` into every render. */
    protected readonly i18nService?: I18nService,
  ) {
    super();
  }

  protected abstract buildEnvelope(): Promise<Envelop>;

  /** Lang-bound translator — bound to `this` so it stays correct when passed by reference into view data. */
  protected t = (key: string, options?: Record<string, unknown>): string => {
    if (!this.i18nService) {
      throw new Error(`${this.constructor.name}: this.t() called without an i18nService`);
    }
    return this.i18nService.translate(key, { lang: this.lang, ...options }) as string;
  };

  set viewParams(viewParams: ViewParams) {
    this._viewParams = viewParams;
    this.envelopePromise = null;
  }
  /** Formats a plain email as `Display Name <email@domain.com>` for mail clients. */
  formatMailFrom(email: string, displayName: string): string {
    if (email.includes('<')) {
      return email;
    }

    return `${displayName} <${email}>`;
  }

  async envelope(): Promise<Envelop> {
    if (!this.envelopePromise) {
      this.envelopePromise = this.buildEnvelope();
    }

    const envelope = await this.envelopePromise;
    envelope.from = this.formatMailFrom(envelope.from, 'A11STUDIO');
    return envelope;
  }

  private async getRecipientEmail(): Promise<string | null> {
    const { to } = await this.envelope();
    const recipient = Array.isArray(to) ? to[0] : to;
    return recipient ?? null;
  }

  /**
   * Builds the view payload for every email. Always injects the lang-bound
   * `t` from this mailable so templates (and shared includes like footer)
   * use one translator — never the unbound default on ViewService globals.
   */
  private buildViewData(extra: ViewData = {}): ViewData {
    return {
      ...this._viewParams.data,
      ...extra,
      contact: this.getContactInfo(),
      ...(this.i18nService ? { t: this.t } : {}),
    };
  }

  /**
   * Company contact details rendered in every email footer, sourced entirely
   * from env-backed config. The postal address is legally mandatory
   * (CAN-SPAM / GDPR), so keep COMPANY_ADDRESS set in every deployed env.
   */
  private getContactInfo(): {
    address?: string;
    social: { instagram?: string };
  } {
    const app = getConfigValue('app');
    return {
      address: app.address,
      social: {
        instagram: app.social?.instagram,
      },
    };
  }

  async content(): Promise<Content> {
    const email = await this.getRecipientEmail();

    if (!email) {
      return {};
    }

    // If we don't have email preferences (e.g. manually constructed mailables),
    // default to sending and do not include unsubscribe URLs.
    if (!this.emailPreferencesService) {
      ApiMailService.emailLog.info(`Sending mail (no preference check): ${email}`, {
        email,
        email_type: this._viewParams.emailType,
        view: this._viewParams.viewPath,
      });
      return {
        html: await this.viewService.render(
          this._viewParams.viewPath,
          this.buildViewData({ unsuscribeUrl: '' }),
        ),
      };
    }

    const { canSend, unsuscribeUrl } = await this.emailPreferencesService.getDeliveryStatus(
      email,
      this._viewParams.emailType,
    );

    if (!canSend) {
      ApiMailService.emailLog.warn(`Mail skipped by email preferences: ${email}`, {
        email,
        email_type: this._viewParams.emailType,
        view: this._viewParams.viewPath,
      });
      return {};
    }

    ApiMailService.emailLog.info(`Sending mail: ${email}`, {
      email,
      email_type: this._viewParams.emailType,
      view: this._viewParams.viewPath,
    });

    return {
      html: await this.viewService.render(
        this._viewParams.viewPath,
        this.buildViewData({ unsuscribeUrl }),
      ),
      headers: this.buildUnsubscribeHeaders(unsuscribeUrl),
    };
  }

  /** RFC 8058 one-click unsubscribe headers — lets mail clients offer unsubscribe without opening the email. */
  private buildUnsubscribeHeaders(unsuscribeUrl: string): Record<string, string> | undefined {
    if (!unsuscribeUrl) {
      return undefined;
    }

    return {
      'List-Unsubscribe': `<${unsuscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }
}
