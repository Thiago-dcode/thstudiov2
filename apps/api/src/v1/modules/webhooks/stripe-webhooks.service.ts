import { Injectable } from '@nestjs/common';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import Stripe from 'stripe';
import { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';
import { PlanPricesService } from '../plan-prices/plan-prices.service';
import { UserService } from '../users/users.service';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import {Helpers} from 'src/common/services/helpers.service';
import { OnEvent } from '@nestjs/event-emitter';
import { WEBHOOK_STRIPE_EVENT } from './webhook.constants';
import { paypal } from '@repo/backend-lib/services/payment-service/paypal';
import { PlanSubscription } from '@repo/common-lib/types/plan-subscription';

@Injectable()
export class StripeWebhooksService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'webhook',
    name: 'stripe',
    callback: {
      channel: 'webhook/error',
      callback: Helpers.callback500ErrorMail,
    },
  });

  constructor(
    private readonly planSubscriptionService: PlanSubscriptionsService,
    private readonly planPriceService: PlanPricesService,
    private readonly userService: UserService,
  ) {}
  @OnEvent(WEBHOOK_STRIPE_EVENT)
  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.debug(`${StripeWebhooksService.name} ${event.type}`);
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(
            event.data.object as Stripe.PaymentMethod,
          );
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          );
          break;

        default:
          this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (err) {
      const isError = err instanceof Error;
      this.logger
        .channel('webhook/error')
        .error(
          `${event?.type} Webhook stripe handler failed`,
          isError ? err : undefined,
        );
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    this.logger.debug(
      `Checkout session completed: ${session.id} ${session.mode}`,
    );
    // TODO: Activate subscription based on session.metadata.planSubscriptionId
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.debug(`Payment intent succeeded: ${paymentIntent.id}`);
    // TODO: Update payment status
  }

  private async handlePaymentMethodAttached(
    paymentMethod: Stripe.PaymentMethod,
  ): Promise<void> {
    this.logger.debug(`Payment method attached: ${paymentMethod.id}`);
    // TODO: Handle payment method attachment
  }

  private async handleSubscriptionUpdate(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    this.logger.debug('Subscription ', subscription);
    const stripeSubscriptionId = subscription.id;
    const itemData = subscription.items.data[0];
    const stripeItemId = itemData.id;
    const is_active = subscription.status === 'active';
    const is_trialing = subscription.status === 'trialing';
    const start_billing_date = new Date(itemData.current_period_start * 1000);
    const next_billing_date = new Date(itemData.current_period_end * 1000);
    const user = await this.userService.findOneByStripeId(
      subscription.customer as string,
    );
    const [planPrice, _internalSubscription] = await Promise.all([
      this.planPriceService.findOneByStripeId(itemData.price.id),
      this.planSubscriptionService.findActiveSubscription(user.id),
    ]);
let internalSubscription:PlanSubscription = _internalSubscription;
    if (internalSubscription?.stripe_id === stripeSubscriptionId) {
      this.logger.debug(`Updating subscription`,{
        stripeId: internalSubscription.stripe_id,
      });
    internalSubscription=  await this.planSubscriptionService.update(internalSubscription.id, {
        is_active,
        is_trialing,
        payment_method: 'CARD',
        start_billing_date,
        next_billing_date,
        stripe_item_id: stripeItemId,
        plan_price_id: planPrice.id,
        amount: planPrice.price,
      });
      this.logger.debug(`Updated subscription`,internalSubscription);
    } else {

      internalSubscription = await this.planSubscriptionService.create({
        payment_method: 'CARD',
        plan_price_id: planPrice.id,
        amount: planPrice.price,
        auto_renewal: true,
        is_active,
        next_billing_date,
        start_billing_date,
        stripe_id: stripeSubscriptionId,
        stripe_item_id: stripeItemId,
        is_trialing,
        user_id: user.id,
        paypal_id: null,
        plan_offer_id: null,
      });
      this.logger.debug(`created subscription`,internalSubscription);

    }
    if (is_active) {
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'active',
      });
      this.logger.debug(`Found ${existingSubscriptions.data.length} stripe active subscriptions`);

      await Promise.all([
        Promise.all(
          existingSubscriptions.data.map(async (sub) => {
            if (sub.id !== internalSubscription.stripe_id) {
              this.logger.debug(`Canceling stripe subscription with ID: ${sub.id}`);
              await stripe.subscriptions.cancel(sub.id);
            }
          }),
        ),

        this.planSubscriptionService.desactivateAllUserSubscriptions(user.id, [
          internalSubscription.id,
        ]),

        internalSubscription.paypal_id
          ? (await paypal).subscription.cancel(internalSubscription.paypal_id)
          : Promise.resolve(),
      ]);
    }
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    
    const user = await this.userService.findOneByStripeId(subscription.customer as string);
    const internalSubscription = await this.planSubscriptionService.findActiveSubscription(user.id);

    if(internalSubscription?.stripe_id === subscription.id){
    
    const freeSubscription =   await this.planSubscriptionService.setFreeSubscription(user);
    this.logger.debug(`Setting free plan to user`,{
      freeSubscription
        
    });
    }
    // TODO: Handle subscription cancellation
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.debug(`Invoice paid: ${invoice.id}`);
    // TODO: Handle successful invoice payment
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    this.logger.warn(`Invoice payment failed: ${invoice.id}`);
    // TODO: Handle failed invoice payment
  }
}
