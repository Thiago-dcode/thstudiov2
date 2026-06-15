import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SetFreeSubscriptionEvent } from './events/set-free-subscription.event';
import { SET_FREE_SUBSCRIPTION_EVENT } from '@repo/common-lib/constants/constants';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { InitiatePlanSubscriptionRequest } from './requests/initiate-plan-subscription.request';
import { PlanPricesService } from '../plan-prices/plan-prices.service';
import { RequestService } from 'src/common/services/request.service';
import { PlansService } from '../plans/plans.service';
import {
  CreatePlanSubscriptionInput,
  PlanSubscriptionSchema,
  UpdatePlanSubscriptionInput,
} from '@repo/common-lib/schemas/plan-subscription';
import { FullPlan } from '@repo/common-lib/types/plan';
import {
  HandleSubscriptionProcessInput,
  HandleSubscriptionProcessResponse,
} from '@repo/common-lib/types/plan-subscription';
import { Helpers } from 'src/common/services/helpers.service';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { StripeService } from 'src/common/services/stripe.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { paypal } from '@repo/backend-lib/services/payment-service/paypal';
import { PaymentMethodsService } from '../utils/payment-methods.service';
import { CACHE_KEY_ACTIVE_SUBSCRIPTION, CACHE_KEY_ACTIVE_PLAN } from '@repo/common-lib/constants/constants';
import { cleanObj } from '@repo/common-lib/utils/object';
import { CustomerPortalRequest } from './requests/customer-portal.request';
import { Benefit } from '@repo/common-lib/types/benefit';
import { UserBenefitService } from '../user-benefit/user-benefit.service';

@Injectable()
export class PlanSubscriptionsService {
  constructor(
    private readonly logger: LogService,
    private readonly planSubscriptionsRepository: PlanSubscriptionsRepository,
    private readonly planPriceService: PlanPricesService,
    private readonly requestService: RequestService,
    private readonly planService: PlansService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly userBenefitsService: UserBenefitService,
    private readonly helpers: Helpers,
  ) {}

  async initiate({
    plan_price_id,
    success_url,
    cancel_url,
    payment_method,
    benefit_id
  }: InitiatePlanSubscriptionRequest): Promise<HandleSubscriptionProcessResponse> {
    try {
      this.logger.info('Initiating plan subscription process', {
        plan_price_id,
        payment_method,
        benefit_id,
        userId: this.requestService.user.id
      });

      const paymentMethod =
        await this.paymentMethodsService.getOne(payment_method);
      if (!paymentMethod || !paymentMethod.enabled) {
        this.logger.error('Payment method not available or disabled', { payment_method });
        throw new HttpException('Payment method not available', 422);
      }
      const planPrice = await this.planPriceService.findOne(plan_price_id);
      if (!planPrice) {
        this.logger.error('Plan price does not exist', { plan_price_id });
        throw new HttpException('Plan price does not exist', 422);
      }
      let currentUserSubscription =
        await this.planSubscriptionsRepository.findActiveSubscription(
          this.requestService.user.id,
        );

      if (!currentUserSubscription) {

        this.logger.info('No active subscription found, setting free subscription first', { userId: this.requestService.user.id });
        await this.setFreeSubscription(this.requestService.user.id);
        currentUserSubscription = await this.planSubscriptionsRepository.findActiveSubscription(this.requestService.user.id);
        if (!currentUserSubscription) {
          this.logger.error('Failed to find current user subscription after setting free plan', { userId: this.requestService.user.id });
          throw new HttpException("Something went wrong finding current user subscription", 500)
        }
      }
      if (currentUserSubscription?.plan_price_id === planPrice.id) {
        //This endpoint is only for downgrades or upgrades from a paid plan
        this.logger.warn('User already has this plan', { planPriceId: planPrice.id, userId: this.requestService.user.id });
        throw new HttpException(
          'User already has this plan',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (planPrice.plan.is_free) {
        //This should be handle by a cancel method
        //Frontend should avoid request when is the free plan
        this.logger.warn('Attempted to activate a free plan via initiate', { planPriceId: planPrice.id, userId: this.requestService.user.id });
        throw new HttpException(
          'Cannot activate a free plan.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const data: HandleSubscriptionProcessInput = {
        currentUserSubscription,
        newPlanPrice: planPrice,
        successUrl: success_url,
        cancelUrl: cancel_url,
        benefit_id

      };
      let result: HandleSubscriptionProcessResponse;
      switch (payment_method) {
        case 'CARD':
          result = await this.handleStripeSubscription(data);
          break;
        case 'PAYPAL':
          result = await this.handlePaypalSubscription(data);
          break;
      }
      if (result.ok) {
        this.logger.info('Subscription process completed successfully', { result, userId: this.requestService.user.id });
        await this.helpers.deleteManyCached([
          CACHE_KEY_ACTIVE_SUBSCRIPTION(this.requestService.user.id),
          CACHE_KEY_ACTIVE_PLAN(this.requestService.user.id),
        ]);
      }
      return result;
    } catch (error) {
      this.logger.error('Error during initiate plan subscription process', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        plan_price_id,
        payment_method,
        userId: this.requestService.user.id
      });
      const responseError: HandleSubscriptionProcessResponse = {
        message: 'Something went wrong',
        redirect_url: null,
        ok: false,
        paypal_error: null,
        stripe_error: null,
        retryable: false,
      };
      if (error instanceof HttpException) {
        const status = error.getStatus();
        responseError.message = error.message;
        responseError.retryable = status === 422 || status === 400;
      }
      return responseError;
    }
  }

  async cancel(userId: number) {
    this.logger.info('Starting subscription cancellation process', { userId });
    const activeSubscription = await this.findActiveSubscription(userId);

    if (activeSubscription.plan_price.plan.is_free) {
      this.logger.info('Active plan is free, no cancellation needed', { userId, subscriptionId: activeSubscription.id });
      return activeSubscription;
    }

    if (activeSubscription.stripe_id) {
      this.logger.info('Canceling Stripe subscription at period end', { stripeId: activeSubscription.stripe_id, userId });
      // Cancel at end of billing cycle, not immediately
      const updatedStripeSub = await stripe.subscriptions.update(
        activeSubscription.stripe_id,
        { cancel_at_period_end: true },
      );
      await this.update(activeSubscription.id, {
        auto_renewal: false,
        cancel_at: updatedStripeSub.cancel_at
          ? new Date(updatedStripeSub.cancel_at * 1000)
          : null,
      });
      this.logger.info('Updated subscription status in database to cancel at period end', { subscriptionId: activeSubscription.id, cancel_at: updatedStripeSub.cancel_at });
    } else {
      this.logger.info('No Stripe ID found, canceling subscription immediately in database', { subscriptionId: activeSubscription.id, userId });
      await this.update(activeSubscription.id, {
        auto_renewal: false,
        cancel_at: null,
      });
    }

    //TODO: Send email to user
    this.logger.info('Subscription cancelled successfully', { userId, subscriptionId: activeSubscription.id });

    return activeSubscription;
  }
  async findActiveSubscription(userId: number) {
    return await this.helpers.cacheRemember(CACHE_KEY_ACTIVE_SUBSCRIPTION(userId), this.planSubscriptionsRepository.findActiveSubscription(
      userId,
    ), {
      append_language: false,
      ttl: 1000 * 60 * 60 * 24,
    });
  }
  async handleStripeSubscription({
    currentUserSubscription,
    newPlanPrice,
    successUrl,
    cancelUrl,
    benefit_id
  }: HandleSubscriptionProcessInput): Promise<HandleSubscriptionProcessResponse> {
    const customerId = this.requestService.user?.stripe_customer_id;

    this.logger.info('Starting handleStripeSubscription', {
      customerId,
      newPlanPriceId: newPlanPrice?.id,
      benefit_id,
      currentUserSubscriptionId: currentUserSubscription?.id
    });

    // Validate required Stripe IDs
    if (!customerId) {
      this.logger.error('Stripe customer ID not found for user', { userId: this.requestService.user.id });
      throw new HttpException(
        'Your account is still being set up. Please try again in a moment.',
        500,
      );
    }

    if (!newPlanPrice?.stripe_id) {
      this.logger.error('Plan price has no Stripe ID', { planPriceId: newPlanPrice?.id });
      throw new HttpException('This plan is not available for purchase.', 500);
    }
    try {
      const stripeSubscription = currentUserSubscription.stripe_id
        ? await stripe.subscriptions.retrieve(currentUserSubscription.stripe_id)
        : null;

      console.log(stripeSubscription);
      const paymentMethods =
        await StripeService.getUserPaymentMethod(customerId);
      const hasCompleteSubscription =
        currentUserSubscription &&
        currentUserSubscription?.stripe_id &&
        currentUserSubscription?.stripe_item_id &&
        stripeSubscription &&
        (stripeSubscription.status === 'active' ||
          stripeSubscription.status === 'trialing');
      paymentMethods.length > 0;
      if (!hasCompleteSubscription) {

        //Handle benefit.
        let benefit: Benefit = null;
        if (benefit_id && !(await this.userBenefitsService.redeemed(this.requestService.user.id, benefit_id))) {

          benefit = await this.userBenefitsService.getByIdAndUser(benefit_id, this.requestService.user.id);
          this.logger.info('Benefit found and not redeemed', { benefit_id, benefitIdFromDb: benefit?.id });
        } else if (benefit_id) {
          this.logger.info('Benefit already redeemed or not requested', { benefit_id, redeemed: true });
        }

        this.logger.info('Creating Stripe checkout session', { customerId, benefit_id, hasBenefit: !!benefit });
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: 'subscription',

          customer_update: {
            address: 'auto',
          },
          automatic_tax: {
            enabled: true,
          },

          line_items: [
            {
              price: newPlanPrice?.stripe_id,
              quantity: 1,
            },
          ],
          subscription_data: {
            metadata: {
              ...(this.requestService.requestId ? { requestId: this.requestService.requestId } : {}),
              ...(benefit?.trial_days ? { benefit_id: String(benefit_id) } : {})
            },
            ...(benefit?.trial_days ? { trial_period_days: benefit.trial_days } : {})
          },
          ...(benefit?.trial_days && {
            payment_method_collection: 'if_required',
          }),
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        this.logger.info('Stripe checkout session created successfully', { sessionId: session.id, url: session.url });

        return {
          ok: true,
          redirect_url: session.url,
          message: 'Need to checkout',
          stripe_error: null,
          retryable: false,
        };
      }
      const isUpgrade =
        currentUserSubscription.plan_price.price < newPlanPrice.price;

      this.logger.info('Updating existing Stripe subscription', {
        stripeSubscriptionId: currentUserSubscription.stripe_id,
        isUpgrade,
        newPlanPriceId: newPlanPrice.id
      });

      await stripe.subscriptions.update(currentUserSubscription.stripe_id, {
        items: [
          {
            id: currentUserSubscription.stripe_item_id,
            price: newPlanPrice.stripe_id,
          },
        ],
        metadata: {
          ...(this.requestService.requestId ? { requestId: this.requestService.requestId } : {})
        },
        automatic_tax: {
          enabled: true,
        },
        proration_behavior: isUpgrade ? 'always_invoice' : 'none',
        payment_behavior: isUpgrade ? 'error_if_incomplete' : undefined,
        billing_cycle_anchor:
          isUpgrade || newPlanPrice.id !== currentUserSubscription.plan_price_id
            ? 'now'
            : 'unchanged',
      });
      this.logger.info('Stripe subscription updated successfully', { stripeSubscriptionId: currentUserSubscription.stripe_id, newPlanPriceId: newPlanPrice.id });
      return {
        ok: true,
        redirect_url: null,
        message: 'Subscription updated',
        stripe_error: null,
        retryable: false,
      };
    } catch (error) {
      console.log(error);
      const stripeError = StripeService.parseError(error);
      const errorMessage = stripeError
        ? stripeError.message
        : error instanceof Error
          ? error.message
          : 'HANDLE STRIPE SUBSCRIPTION ERROR';
      this.logger.error('HANDLE STRIPE SUBSCRIPTION ERROR', {
        currentUserSubscription,
        error: stripeError || error,
      });
      if (!stripeError || stripeError.statusCode >= 500) {
        Helpers.callback500ErrorMail(
          'error',
          errorMessage,
          stripeError || error,
        );
      }
      if (stripeError) {
        return {
          ok: false,
          redirect_url: null,
          message:
            stripeError?.message || 'Something went wrong, try again later',
          stripe_error: stripeError,
          retryable: stripeError.isRetryable,
        };
      }
    }
  }

  async handlePaypalSubscription({
    currentUserSubscription,
    newPlanPrice,
    successUrl,
    cancelUrl,
  }: HandleSubscriptionProcessInput): Promise<HandleSubscriptionProcessResponse> {
    throw new HttpException('Paypal payment method is not available', 422);
    const paypalClient = await paypal;
    if (!newPlanPrice?.paypal_id) {
      throw new HttpException('This plan is not available for purchase.', 422);
    }
    //Check if the subscription has a paypal_id
    const isUpgrade =
      currentUserSubscription.plan_price.price < newPlanPrice.price;

    //If is an updgrade we will enforce a brand new paypal subscription
    //Lately on the webhook, we will cancel the previous one.

    if (!currentUserSubscription.paypal_id || isUpgrade) {
      const subscription = await paypalClient.subscription.create({
        plan_id: newPlanPrice.paypal_id,
        quantity: '1',
        subscriber: {
          email_address: this.requestService.user.email,
        },
        application_context: {
          cancel_url: cancelUrl,
          return_url: successUrl,
          brand_name: 'A11STUDIO',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
        },
      });
      return {
        ok: true,
        message: 'Initialazing paypal subscription process',
        redirect_url: subscription.links.find((link) => link.rel === 'approve')
          .href,
        paypal_error: null,
        retryable: false,
      };
    }

    //downgrade

    return {
      message: '',
      ok: true,
      paypal_error: {},
      redirect_url: null,
      retryable: false,
    };
  }

  async getCustomerSubscriptionPortal(
    request: CustomerPortalRequest,
  ): Promise<{
    url: string;
  }> {
    const customerId = this.requestService.user?.stripe_customer_id;
    this.logger.info('Getting customer subscription portal', { customerId, return_url: request?.return_url });
    if (!customerId) {
      this.logger.error('Stripe customer not found for portal session', { userId: this.requestService.user?.id });
      throw new HttpException('Stripe customer not found', 422);
    }
    if (!request?.return_url || typeof request.return_url !== 'string') {
      this.logger.error('Invalid return_url for portal session', { customerId, return_url: request?.return_url });
      throw new HttpException('return_url is required', 422);
    }
    let parsed: URL;
    try {
      parsed = new URL(request.return_url);
    } catch {
      this.logger.error('return_url is not a valid URL format', { customerId, return_url: request.return_url });
      throw new HttpException('return_url must be a valid URL', 422);
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      this.logger.error('return_url must be http(s)', { customerId, return_url: request.return_url });
      throw new HttpException('return_url must be http(s)', 422);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: request.return_url,
    });
    this.logger.info('Stripe billing portal session created', { url: session?.url });
    if (!session?.url) {
      this.logger.error('Could not create customer portal session (no URL returned)', { customerId });
      throw new HttpException('Could not create customer portal session', 500);
    }
    return { url: session.url };
  }

  async setFreeSubscription(userId: number): Promise<{
    plan: Omit<FullPlan, 'translation'>;
    subscription: PlanSubscriptionSchema;
  }> {
    this.logger.info('Setting free subscription for user', { userId });
    //Plans with plan and plan prices must always exist. If not, BIG PROBLEM.
    const freePlan = await this.planService.findFreePlan();
    if (!freePlan) {
      this.logger.error('Free plan not found in database', { userId });
      throw new HttpException('Free plan not found', 500);
    }
    const lifetimePrice = freePlan.prices.find(
      (price) => price.billing_type === 'LIFETIME',
    );
    if (!lifetimePrice) {
      this.logger.error('Lifetime price not found for free plan', { planId: freePlan.id, userId });
      throw new HttpException('Lifetime price not found', 500);
    }

    await this.desactivateAllUserSubscriptions(userId);

    const subscription = await this.create({
      is_active: true,
      is_trialing: false,
      amount: 0,
      payment_method: 'CARD',
      start_billing_date: new Date(),
      next_billing_date: this.helpers.getNextBillingDate(
        lifetimePrice.billing_type,
      ),
      user_id: userId,
      stripe_id: null,
      stripe_item_id: null,
      auto_renewal: true,
      cancel_at: null,
      paypal_id: null,
      plan_offer_id: null,
      plan_price_id: lifetimePrice.id,
    });
    this.logger.info('Free subscription successfully set for user', { userId, subscriptionId: subscription.id, planPriceId: lifetimePrice.id });
    return {
      plan: freePlan,
      subscription
    }
  }
  async create(planData: CreatePlanSubscriptionInput) {
    this.logger.info('Creating new plan subscription', { userId: planData.user_id, planPriceId: planData.plan_price_id });
    const [planSubScription] = await Promise.all([
      this.planSubscriptionsRepository.create(planData),
      this.helpers.deleteManyCached([CACHE_KEY_ACTIVE_SUBSCRIPTION(planData.user_id), CACHE_KEY_ACTIVE_PLAN(planData.user_id)]),

    ])

    return planSubScription;
  }

  async desactivateAllUserSubscriptions(
    userId: string | number,
    skipSubscriptions: number[] = [],
  ) {
    this.logger.info('Deactivating all user subscriptions', { userId, skipSubscriptions });

    await Promise.all([
      this.helpers.deleteManyCached([
        CACHE_KEY_ACTIVE_SUBSCRIPTION(userId),
        CACHE_KEY_ACTIVE_PLAN(userId),
      ]),
      this.planSubscriptionsRepository.update(
        {
          is_active: false,
        },
        {
          wheres: [
            {
              column: 'user_id',
              operator: '=',
              value: userId,
            },
            ...(skipSubscriptions.length > 0
              ? [
                {
                  column: 'id',
                  operator: 'NOT IN' as const,
                  value: skipSubscriptions,
                },
              ]
              : []),
          ],
        },
      )
    ])

  }

  async findAll() {
    return `This action returns all plan subscriptions`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} plan subscription`;
  }

  async update(
    id: number,
    updatePlanSubscriptionDto: UpdatePlanSubscriptionInput,
    userId?: number,
  ) {
    this.logger.info('Updating plan subscription', { subscriptionId: id, userId, updateData: updatePlanSubscriptionDto });
    if (userId) {
      await this.helpers.deleteManyCached([
        CACHE_KEY_ACTIVE_SUBSCRIPTION(userId),
        CACHE_KEY_ACTIVE_PLAN(userId),
      ]);
    }
    cleanObj(updatePlanSubscriptionDto)
    return await this.planSubscriptionsRepository.updateOne(
      id,
      updatePlanSubscriptionDto,
    );
  }

  remove(id: number) {
    return `This action removes a #${id} plan subscription`;
  }

  @OnEvent(SET_FREE_SUBSCRIPTION_EVENT)
  async handleSetFreeSubscription(event: SetFreeSubscriptionEvent) {
    const result = await this.setFreeSubscription(event.userId);
    this.logger.info(
      `${SET_FREE_SUBSCRIPTION_EVENT} user [${event.userId}] set free plan`,
      { result },
    );
  }
}
