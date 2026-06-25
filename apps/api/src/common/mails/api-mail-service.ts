import { Injectable } from '@nestjs/common';
import { Content, Envelop, Mailable } from '@repo/backend-lib/services/mail-service';
import { ViewService } from '@repo/backend-lib/services/view-service/base';
import { ViewData } from '@repo/backend-lib/services/view-service/types';
import { EnumType } from '@repo/common-lib/constants/enums';
import { EmailPreferencesService } from 'src/v1/modules/email-preferences/email-preferences.service';

type ViewParams = {
  viewPath: string;
  data: ViewData;
  emailType: EnumType<'EMAIL_TYPE'>;
};

@Injectable()
export abstract class ApiMailService extends Mailable {
  private envelopePromise: Promise<Envelop> | null = null;

  constructor(
    protected readonly viewService: ViewService,
    protected readonly emailPreferencesService: EmailPreferencesService | undefined,
    protected _viewParams: ViewParams,
  ) {
    super();
  }

  protected abstract buildEnvelope(): Promise<Envelop>;

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

  async content(): Promise<Content> {
    const email = await this.getRecipientEmail();

    if (!email) {
      return {};
    }

    // If we don't have email preferences (e.g. manually constructed mailables),
    // default to sending and do not include unsubscribe URLs.
    if (!this.emailPreferencesService) {
      return {
        html: await this.viewService.render(this._viewParams.viewPath, {
          ...this._viewParams.data,
          unsuscribeUrl: '',
        }),
      };
    }

    const { canSend, unsuscribeUrl } = await this.emailPreferencesService.getDeliveryStatus(
      email,
      this._viewParams.emailType,
    );

    if (!canSend) {
      return {};
    }

    return {
      html: await this.viewService.render(this._viewParams.viewPath, {
        ...this._viewParams.data,
        unsuscribeUrl,
      }),
    };
  }
}
