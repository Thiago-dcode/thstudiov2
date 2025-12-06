import { Injectable } from '@nestjs/common';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhooksService {
    private readonly logger = FactoryLogService.createLogService('file',{
        'channel':'webhook',
        name:'stripe',
    });

    async handleEvent(event: Stripe.Event): Promise<void> {
        this.logger.debug(`${StripeWebhooksService.name} ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'payment_intent.succeeded':
                await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;

            case 'payment_method.attached':
                await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'invoice.paid':
                await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            default:
                this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
        }
    }

    private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
        this.logger.debug('Checkout session metadata:',session.metadata);
        this.logger.debug(`Checkout session completed: ${session.id} ${session.mode}`);
        // TODO: Activate subscription based on session.metadata.planSubscriptionId
    }

    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
        this.logger.debug(`Payment intent succeeded: ${paymentIntent.id}`);
        // TODO: Update payment status
    }

    private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
        this.logger.debug(`Payment method attached: ${paymentMethod.id}`);
        // TODO: Handle payment method attachment
    }

    private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
        this.logger.debug(`Subscription updated`,{subscription});
        // TODO: Update subscription status
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
        this.logger.debug(`Subscription deleted: ${subscription.id}`);
        // TODO: Handle subscription cancellation
    }

    private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
        this.logger.debug(`Invoice paid: ${invoice.id}`);
        // TODO: Handle successful invoice payment
    }

    private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        this.logger.warn(`Invoice payment failed: ${invoice.id}`);
        // TODO: Handle failed invoice payment
    }


}

