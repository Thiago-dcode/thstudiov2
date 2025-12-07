import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { StripeWebhooksService } from './stripe-webhooks.service';
import { PlanSubscriptionsModule } from '../plan-subscriptions/plan-subscriptions.module';
import { UserModule } from '../users/users.module';
import { PlanPricesModule } from '../plan-prices/plan-prices.module';

@Module({
    controllers: [WebhooksController],
    providers: [StripeWebhooksService],
    imports:[PlanSubscriptionsModule,UserModule,PlanPricesModule]
})
export class WebhooksModule {}
