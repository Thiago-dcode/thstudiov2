import { InjectQueue, Processor } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import type { Checkout as StripeCheckout } from 'stripe-types/checkout';
import type { Event as StripeEvent } from 'stripe-types/Events';
import type { Invoice as StripeInvoice } from 'stripe-types/Invoices';
import type { PaymentIntent as StripePaymentIntent } from 'stripe-types/PaymentIntents';
import type { PaymentMethod as StripePaymentMethod } from 'stripe-types/PaymentMethods';
import type { Subscription as StripeSubscription } from 'stripe-types/Subscriptions';
import { LogService } from '@repo/backend-lib/services/log-service';
import { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';
import { PlanPricesService } from '../plan-prices/plan-prices.service';
import { UserService } from '../users/users.service';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { Helpers } from 'src/common/services/helpers.service';
import { paypal } from '@repo/backend-lib/services/payment-service/paypal';
import { PlanSubscription } from '@repo/common-lib/types/plan-subscription';
import {
  STRIPE_WEBHOOKS_QUEUE,
  JOB_STRIPE_WEBHOOK,
  PLAN_SUBSCRIPTIONS_QUEUE,
  JOB_ON_SUBSCRIPTION_CHANGES,
} from '@repo/common-lib/constants/queues';
import {
  CACHE_KEY_ACTIVE_SUBSCRIPTION,
  CACHE_KEY_ACTIVE_PLAN,
} from '@repo/common-lib/constants/cache';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { UserBenefitService } from '../user-benefit/user-benefit.service';

@Processor(STRIPE_WEBHOOKS_QUEUE)
export class WebhookProcessor extends GlobalProcessor {
  constructor(
    private readonly planSubscriptionService: PlanSubscriptionsService,
    private readonly planPriceService: PlanPricesService,
    private readonly userService: UserService,
    private readonly userBenefitService: UserBenefitService,
    private readonly helpers: Helpers,
    private readonly logger: LogService,
    @InjectQueue(PLAN_SUBSCRIPTIONS_QUEUE) private readonly subscriptionQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<StripeEvent>): Promise<void> {
    const event = job.data;
    this.logger.name(job.name);

    try {
      const object = event?.data?.object as any;
      if (object?.metadata?.requestId) {
        const requestId = object.metadata.requestId;
        this.logger.id(requestId);
      }

      switch (job.name) {
        case JOB_STRIPE_WEBHOOK:
          return await this.handleStripeEvent(event);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.logger.flushAsync();
    }
  }

  private async handleStripeEvent(event: StripeEvent): Promise<void> {
    this.logger.debug(`StripeProcessor ${event.type}`);
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as StripeCheckout.Session,
          );
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as StripePaymentIntent,
          );
          break;

        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(
            event.data.object as StripePaymentMethod,
          );
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(
            event.data.object as StripeSubscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as StripeSubscription,
          );
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as StripeInvoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as StripeInvoice,
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
      throw err; // Re-throw so BullMQ can retry
    }
  }

  private async handleCheckoutSessionCompleted(
    session: StripeCheckout.Session,
  ): Promise<void> {
    this.logger.debug(
      `Checkout session completed: ${session.id} ${session.mode}`,
    );
    // TODO: Activate subscription based on session.metadata.planSubscriptionId
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: StripePaymentIntent,
  ): Promise<void> {
    this.logger.debug(`Payment intent succeeded: ${paymentIntent.id}`);
    // TODO: Update payment status
  }

  private async handlePaymentMethodAttached(
    paymentMethod: StripePaymentMethod,
  ): Promise<void> {
    this.logger.debug(`Payment method attached: ${paymentMethod.id}`);
    // TODO: Handle payment method attachment
  }

  private async handleSubscriptionUpdate(
    subscription: StripeSubscription,
  ): Promise<void> {
    this.logger.debug('Subscription ', subscription);
    const stripeSubscriptionId = subscription.id;
    const itemData = subscription.items.data[0];
    const stripeItemId = itemData.id;
    const is_trialing = subscription.status === 'trialing';
    const is_active = subscription.status === 'active' || is_trialing;
    const start_billing_date = new Date(itemData.current_period_start * 1000);
    const next_billing_date = new Date(itemData.current_period_end * 1000);
    const stripe_cancel_at = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : null;
    const has_payment_method = !!subscription.default_payment_method;
    const auto_renewal =
      !subscription.cancel_at_period_end &&
      !subscription.cancel_at &&
      (!is_trialing || has_payment_method);
    const user = await this.userService.findOneByStripeId(
      subscription.customer as string,
    );
    const [planPrice, _internalSubscription] = await Promise.all([
      this.planPriceService.findOneByStripeId(itemData.price.id),
      this.planSubscriptionService.findActiveSubscription(user.id),
    ]);
    let internalSubscription: PlanSubscription = _internalSubscription;
    if (internalSubscription?.stripe_id === stripeSubscriptionId) {
      this.logger.debug(`Updating subscription`, {
        stripeId: internalSubscription.stripe_id,
      });
      internalSubscription = await this.planSubscriptionService.update(
        internalSubscription.id,
        {
          is_active,
          is_trialing,
          payment_method: 'CARD',
          start_billing_date,
          next_billing_date,
          auto_renewal,
          cancel_at: stripe_cancel_at,
          stripe_item_id: stripeItemId,
          plan_price_id: planPrice.id,
          amount: planPrice.price,
        },
        user.id,
      );
      this.logger.debug(`Updated subscription`, internalSubscription);
    } else {
      const latestSub =
        await this.planSubscriptionService.findLatestSubscription(user.id);

      internalSubscription = await this.planSubscriptionService.create({
        payment_method: 'CARD',
        plan_price_id: planPrice.id,
        amount: planPrice.price,
        auto_renewal,
        cancel_at: stripe_cancel_at,
        is_active,
        next_billing_date,
        start_billing_date,
        stripe_id: stripeSubscriptionId,
        stripe_item_id: stripeItemId,
        is_trialing,
        user_id: user.id,
        paypal_id: null,
        plan_offer_id: null,
        prev_subscription_id: latestSub?.id ?? null,
      });
      this.logger.debug(`created subscription`, internalSubscription);
      const benefitIdRaw = subscription.metadata?.benefit_id;
      try {
        if (benefitIdRaw != null && benefitIdRaw !== '') {
          this.logger.debug(`Found benefit_id: {${benefitIdRaw}} `)
          const benefitId = Number.parseInt(benefitIdRaw, 10);
          if (Number.isInteger(benefitId) && benefitId > 0) {
            this.logger.debug("Starting redeem");
            await this.userBenefitService.redeem(user.id, benefitId);
            this.logger.debug(`Redeemed benefit ${benefitId} for user ${user.id}`);
          } else {
            this.logger.warn(
              `Invalid benefit_id in subscription metadata: ${benefitIdRaw}`,
            );
          }
        }
      } catch (error) {

        console.log("ERROR REDEEMING", error);
        this.logger.error(
          `Something went wrong redeeming the benefit: ${benefitIdRaw}`, error instanceof Error ? error : undefined
        );

      }

    }
    if (is_active || is_trialing) {
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'active',
      });
      this.logger.debug(
        `Found ${existingSubscriptions.data.length} stripe active subscriptions`,
      );

      await Promise.all([
        Promise.all(
          existingSubscriptions.data.map(async (sub) => {
            if (sub.id !== internalSubscription.stripe_id) {
              this.logger.debug(
                `Canceling stripe subscription with ID: ${sub.id}`,
              );
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

    // _internalSubscription is the plan the user was on before this webhook event (or null if brand new).
    const subscriptionChangeJobPayload = {
      ...user,
      prevPlanName: _internalSubscription?.plan_price?.plan?.name ?? null,
      prevPlanBasePrice: _internalSubscription?.plan_price?.plan?.base_price ?? null,
    };

    await Promise.all([
      this.helpers.deleteManyCached([
        CACHE_KEY_ACTIVE_SUBSCRIPTION(user.id),
        CACHE_KEY_ACTIVE_PLAN(user.id),
      ]),
      this.subscriptionQueue.add(
        JOB_ON_SUBSCRIPTION_CHANGES,
        subscriptionChangeJobPayload,
        {
          jobId: `plan-subscription-${internalSubscription.user_id}-${Date.now()}`,
          priority: 10,
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      )])
  }

  private async handleSubscriptionDeleted(
    subscription: StripeSubscription,
  ): Promise<void> {
    const user = await this.userService.findOneByStripeId(
      subscription.customer as string,
    );
    const internalSubscription =
      await this.planSubscriptionService.findActiveSubscription(user.id);

    this.logger.debug("Subscription to delete", internalSubscription)
    if (internalSubscription?.stripe_id === subscription.id) {
      const freeSubscription =
        await this.planSubscriptionService.setFreeSubscription(user.id);
      this.logger.debug(`Setting free plan to user`, {
        freeSubscription,
      });
      const subscriptionChangeJobPayload = {
        ...user,
        prevPlanName: internalSubscription.plan_price.plan.name,
        prevPlanBasePrice: internalSubscription.plan_price.plan.base_price,
      };
      await this.subscriptionQueue.add(
        JOB_ON_SUBSCRIPTION_CHANGES,
        subscriptionChangeJobPayload,
        {
          jobId: `plan-subscription-${internalSubscription.user_id}-${Date.now()}`,
          priority: 10,
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      )
    }
    await this.helpers.deleteManyCached([
      CACHE_KEY_ACTIVE_SUBSCRIPTION(user.id),
      CACHE_KEY_ACTIVE_PLAN(user.id),
    ]);
  }

  private async handleInvoicePaid(invoice: StripeInvoice): Promise<void> {
    this.logger.debug(`Invoice paid: ${invoice.id}`);
    // TODO: Handle successful invoice payment
  }

  private async handleInvoicePaymentFailed(
    invoice: StripeInvoice,
  ): Promise<void> {
    this.logger.warn(`Invoice payment failed: ${invoice.id}`);
    // TODO: Handle failed invoice payment
  }
}
