import {
    Controller,
    Post,
    Req,
    Headers,
    BadRequestException,
} from '@nestjs/common';
import { stripe, stripeWebhookSecret } from '@repo/backend-lib/services/payment-service/stripe';
import { StripeWebhooksService } from './stripe-webhooks.service';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('webhooks')
export class WebhooksController {
    private  logger = FactoryLogService.createLogService('file',{
        channel:'webhook',
    });

    constructor(private readonly stripeWebhooksService: StripeWebhooksService) {}
    @Public()
    @Post('stripe')
    async stripe(
        @Headers('stripe-signature') signature: string,
        @Req() req: { rawBody?: Buffer },
    ) {
        this.logger = this.logger.name('paypal');
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }
        if (!req.rawBody) {
            throw new BadRequestException('Raw body not available');
        }

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                stripeWebhookSecret,
            );
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            this.logger.error(`Webhook signature verification failed: ${message}`);
            throw new BadRequestException('Webhook signature verification failed');
        }

        await this.stripeWebhooksService.handleEvent(event);

        return { received: true };
    }

    // @Post('paypal')
    // async handlePaypalWebhook(@Body() body: unknown) {
    //     // await this.webhooksService.handlePaypalEvent(body);

    //     return { received: true };
    // }
}
