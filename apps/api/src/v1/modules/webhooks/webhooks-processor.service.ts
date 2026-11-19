import { InjectQueue, Processor } from '@nestjs/bullmq';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import type { Checkout as StripeCheckout } from 'stripe-types/checkout';
import type { Event as StripeEvent } from 'stripe-types/Events';
import type { Invoice as StripeInvoice } from 'stripe-types/Invoices';
import type { PaymentIntent as StripePaymentIntent } from 'stripe-types/PaymentIntents';
import type { PaymentMethod as StripePaymentMethod } from 'stripe-types/PaymentMethods';
import type { Subscription as StripeSubscription } from 'stripe-types/Subscriptions';
import { LogService } from '@repo/backend-lib/services/log-service';
import { enqueueJob, isFinalAttempt } from '@repo/backend-lib/utils';
import { apiLogConfig } from 'src/common/utils/api-logger';
import { runWithTraceId } from 'src/common/services/request-storage';
import { StripeService } from 'src/common/services/stripe.service';
import type Stripe from 'stripe';
import { StripeEventRefIds, stripeEventRefs } from './stripe-event-refs';
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

type EventLog = {
  info: (message: string, extra?: Record<string, unknown>) => void;
  warn: (message: string, extra?: Record<string, unknown>) => void;
  error: (message: string, extra?: Record<string, unknown>) => void;
  critical: (message: string, extra?: Record<string, unknown>) => void;
  /** The same lines with more ids (the user, once resolved). */
  with: (more: StripeEventRefIds) => EventLog;
};

/** `logger` with the event's ids in every line's extraInfo. Per event: the logger is shared. */
const withIds = (logger: LogService, ids: StripeEventRefIds): EventLog => ({
  info: (message, extra) => void logger.info(message, { ...ids, ...extra }),
  warn: (message, extra) => void logger.warn(message, { ...ids, ...extra }),
  error: (message, extra) => void logger.error(message, { ...ids, ...extra }),
  critical: (message, extra) => void logger.critical(message, { ...ids, ...extra }),
  with: (more) => withIds(logger, { ...ids, ...more }),
});

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


    // Recomputed from the event: the request that caused it, when the object carries a fresh
    // trace id (also covers jobs queued before the controller enqueued with it), else the job's.
    // The event's ids go in every line's extraInfo. Never name/id builders here: this logger is
    // shared by every event.
    const refs = stripeEventRefs(event as unknown as Stripe.Event);
    const log = withIds(this.logger, refs.ids);
    const traceId = StripeService.traceIdFromMetadata(refs.metadata, event?.created);
    const handle = () => this.handleStripeEvent(job, event, log);

    switch (job.name) {
      case JOB_STRIPE_WEBHOOK:
        return await (traceId ? runWithTraceId(traceId, handle) : handle());

      default:
        throw new Error(`Job name "${job.name}" not recognized`);
    }
  }

  private async handleStripeEvent(job: Job<StripeEvent>, event: StripeEvent, log: EventLog): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as StripeCheckout.Session,
            log,
          );
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as StripePaymentIntent,
            log,
          );
          break;

        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(
            event.data.object as StripePaymentMethod,
            log,
          );
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(
            event.data.object as StripeSubscription,
            log,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as StripeSubscription,
            log,
          );
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as StripeInvoice, log);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as StripeInvoice,
            log,
          );
          break;

        default:
          log.info('Stripe webhook event ignored', { reason: 'unhandled_type' });
      }
    } catch (err) {
      const failure = {
        error_name: err instanceof Error ? err.name : typeof err,
        error_message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      };
      // BullMQ retries 5x; only the last failure needs a human.
      if (isFinalAttempt(job)) {
        log.critical('Stripe webhook processing failed permanently', { ...failure, will_retry: false });
      } else {
        log.error('Stripe webhook processing failed', { ...failure, will_retry: true });
      }
      throw err; // Re-throw so BullMQ can retry
    }
  }

  private async handleCheckoutSessionCompleted(
    session: StripeCheckout.Session,
    log: EventLog,
  ): Promise<void> {
    log.info('Stripe checkout session completed', {
      mode: session.mode,
      status: session.status,
      payment_status: session.payment_status,
    });
    // TODO: Activate subscription based on session.metadata.planSubscriptionId
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: StripePaymentIntent,
    log: EventLog,
  ): Promise<void> {
    log.info('Stripe payment succeeded', {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
    // TODO: Update payment status
  }

  private async handlePaymentMethodAttached(
    paymentMethod: StripePaymentMethod,
    log: EventLog,
  ): Promise<void> {
    // Never the card object: only the method type.
    log.info('Stripe payment method attached', { type: paymentMethod.type });
    // TODO: Handle payment method attachment
  }

  private async handleSubscriptionUpdate(
    eventSubscription: StripeSubscription,
    log: EventLog,
  ): Promise<void> {
    // Stripe delivers events out of order and retries them, so this event's snapshot can be
    // older than what we already applied: an `updated` arriving after the subscription was
    // cancelled used to recreate it as active (and cancel the customer's real one below). Act on
    // the subscription as it is now.
    const subscription = (await stripe.subscriptions.retrieve(
      eventSubscription.id,
    )) as unknown as StripeSubscription;
    if (
      subscription.status !== eventSubscription.status ||
      subscription.cancel_at_period_end !== eventSubscription.cancel_at_period_end
    ) {
      log.info('Stripe event snapshot stale; applied live state', {
        event_status: eventSubscription.status,
        live_status: subscription.status,
      });
    }
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
    const user = await this.findUserByStripeCustomer(subscription.customer as string, log);
    if (!user) return;
    log = log.with({ user_id: user.id });
    const [planPrice, _internalSubscription] = await Promise.all([
      this.planPriceService.findOneByStripeId(itemData.price.id),
      this.planSubscriptionService.findActiveSubscription(user.id),
    ]);
    if (!planPrice) {
      // Retried; the final attempt alerts through the handler failure above.
      log.error('No plan price for Stripe price', { stripe_price_id: itemData.price.id });
      throw new Error('No plan price for Stripe price');
    }
    let internalSubscription: PlanSubscription = _internalSubscription;
    if (internalSubscription?.stripe_id === stripeSubscriptionId) {
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
      log.info('Subscription synced from Stripe', {
        action: 'updated',
        plan_subscription_id: internalSubscription?.id ?? null,
        plan_price_id: planPrice.id,
        stripe_status: subscription.status,
        is_active,
        is_trialing,
        auto_renewal,
        cancel_at: stripe_cancel_at,
      });
    } else {
      // No live internal subscription matches, and Stripe says this one is not live either
      // (cancelled, incomplete, unpaid): there is nothing to start.
      if (!is_active) {
        log.info('Stripe webhook event ignored', {
          reason: 'inactive_without_match',
          stripe_status: subscription.status,
        });
        return;
      }
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
      log.info('Subscription synced from Stripe', {
        action: 'created',
        plan_subscription_id: internalSubscription?.id ?? null,
        prev_subscription_id: latestSub?.id ?? null,
        plan_price_id: planPrice.id,
        stripe_status: subscription.status,
        is_active,
        is_trialing,
        auto_renewal,
        cancel_at: stripe_cancel_at,
      });
      const benefitIdRaw = subscription.metadata?.benefit_id;
      try {
        if (benefitIdRaw != null && benefitIdRaw !== '') {
          const benefitId = Number.parseInt(benefitIdRaw, 10);
          if (Number.isInteger(benefitId) && benefitId > 0) {
            await this.userBenefitService.redeem(user.id, benefitId);
            log.info('Benefit redeemed', { benefit_id: benefitId });
          } else {
            log.warn('Invalid benefit_id in subscription metadata', { benefit_id_raw: benefitIdRaw });
          }
        }
      } catch (error) {
        log.error('Benefit redeem failed', {
          benefit_id: benefitIdRaw,
          error_message: error instanceof Error ? error.message : String(error),
        });
      }

    }
    if (is_active || is_trialing) {
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'active',
      });
      // One summary line; each cancel also has its own stripe call line.
      const duplicates = existingSubscriptions.data.filter((sub) => sub.id !== internalSubscription.stripe_id);

      await Promise.all([
        Promise.all(duplicates.map((sub) => stripe.subscriptions.cancel(sub.id))),

        this.planSubscriptionService.desactivateAllUserSubscriptions(user.id, [
          internalSubscription.id,
        ]),

        internalSubscription.paypal_id
          ? (await paypal).subscription.cancel(internalSubscription.paypal_id)
          : Promise.resolve(),
      ]);
      if (duplicates.length > 0) {
        log.info('Duplicate Stripe subscriptions cancelled', {
          count: duplicates.length,
          stripe_subscription_ids: duplicates.map((sub) => sub.id),
        });
      }
    }

    // _internalSubscription is the plan the user was on before this webhook event (or null if brand new).
    const subscriptionChangeJobPayload = {
      ...user,
      prevPlanId: _internalSubscription?.plan_price?.plan?.id ?? null,
      prevPlanName: _internalSubscription?.plan_price?.plan?.name ?? null,
      prevPlanBasePrice: _internalSubscription?.plan_price?.plan?.base_price ?? null,
    };

    await Promise.all([
      this.helpers.deleteManyCached([
        CACHE_KEY_ACTIVE_SUBSCRIPTION(user.id),
        CACHE_KEY_ACTIVE_PLAN(user.id),
      ]),
      enqueueJob(this.subscriptionQueue, JOB_ON_SUBSCRIPTION_CHANGES, subscriptionChangeJobPayload, {
        jobId: `plan-subscription-${internalSubscription.user_id}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }, apiLogConfig())])
  }

  /**
   * The user behind a Stripe customer, or null when the account no longer exists. Self-service
   * account deletion cancels the subscription and deletes the customer, and Stripe's resulting
   * events can arrive after the user row is gone; that is expected, not a failure to retry.
   */
  private async findUserByStripeCustomer(customerId: string, log: EventLog) {
    try {
      return await this.userService.findOneByStripeId(customerId);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        log.info('Stripe webhook event ignored', { reason: 'no_user_for_customer' });
        return null;
      }
      throw error;
    }
  }

  private async handleSubscriptionDeleted(
    subscription: StripeSubscription,
    log: EventLog,
  ): Promise<void> {
    const user = await this.findUserByStripeCustomer(subscription.customer as string, log);
    if (!user) return;
    log = log.with({ user_id: user.id });
    const internalSubscription =
      await this.planSubscriptionService.findActiveSubscription(user.id);

    if (internalSubscription?.stripe_id === subscription.id) {
      const freeSubscription =
        await this.planSubscriptionService.setFreeSubscription(user.id);
      log.info('Subscription ended; free plan set', {
        ended_plan_subscription_id: internalSubscription.id,
        free_plan_subscription_id: (freeSubscription as { id?: number } | null)?.id ?? null,
      });
      const subscriptionChangeJobPayload = {
        ...user,
        prevPlanId: internalSubscription.plan_price.plan.id,
        prevPlanName: internalSubscription.plan_price.plan.name,
        prevPlanBasePrice: internalSubscription.plan_price.plan.base_price,
      };
      await enqueueJob(this.subscriptionQueue, JOB_ON_SUBSCRIPTION_CHANGES, subscriptionChangeJobPayload, {
        jobId: `plan-subscription-${internalSubscription.user_id}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }, apiLogConfig());
    } else {
      log.info('Stripe webhook event ignored', { reason: 'not_current_subscription' });
    }
    await this.helpers.deleteManyCached([
      CACHE_KEY_ACTIVE_SUBSCRIPTION(user.id),
      CACHE_KEY_ACTIVE_PLAN(user.id),
    ]);
  }

  private async handleInvoicePaid(invoice: StripeInvoice, log: EventLog): Promise<void> {
    log.info('Stripe invoice paid', {
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      billing_reason: invoice.billing_reason,
    });
    // TODO: Handle successful invoice payment
  }

  private async handleInvoicePaymentFailed(
    invoice: StripeInvoice,
    log: EventLog,
  ): Promise<void> {
    log.warn('Stripe invoice payment failed', {
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      attempt_count: invoice.attempt_count,
      billing_reason: invoice.billing_reason,
      next_payment_attempt: invoice.next_payment_attempt,
    });
    // TODO: Handle failed invoice payment
  }
}
