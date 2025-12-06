import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { StripeWebhooksService } from './stripe-webhooks.service';

@Module({
    controllers: [WebhooksController],
    providers: [StripeWebhooksService],
})
export class WebhooksModule {}
