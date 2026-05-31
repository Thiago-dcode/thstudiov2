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

    async envelope(): Promise<Envelop> {
        if (!this.envelopePromise) {
            this.envelopePromise = this.buildEnvelope();
        }

        return await this.envelopePromise;
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

        // Transactional emails should not be blocked or include unsubscribe URLs.
        if (this._viewParams.emailType === 'TRANSACTIONAL') {
            return {
                html: await this.viewService.render(this._viewParams.viewPath, {
                    ...this._viewParams.data,
                    unsuscribeUrl: '',
                }),
            };
        }

        // If we don't have email preferences (e.g. manually constructed mailables),
        // default to sending.
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
