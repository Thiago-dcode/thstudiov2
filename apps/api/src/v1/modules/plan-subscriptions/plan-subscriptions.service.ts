import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { InitiatePlanSubscriptionRequest } from './requests/initiate-plan-subscription.request';
import { PlanPricesService } from '../plan-prices/plan-prices.service';
import { RequestService } from 'src/common/services/request.service';
import { PlansService } from '../plans/plans.service';
import { BaseUser } from '@repo/common-lib/types/user';
import {
  CreatePlanSubscriptionInput,
  UpdatePlanSubscriptionInput,
} from '@repo/common-lib/schemas/plan-subscription';
import {
  HandleSubscriptionProcessInput,
  HandleSubscriptionProcessResponse,
} from '@repo/common-lib/types/plan-subscription';
import {Helpers} from 'src/common/services/helpers.service';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { StripeService } from 'src/common/services/stripe.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { paypal } from '@repo/backend-lib/services/payment-service/paypal';
import { PaymentMethodsService } from '../utils/payment-methods.service';

@Injectable()
export class PlanSubscriptionsService {
  constructor(
    private readonly logger: LogService,
    private readonly planSubscriptionsRepository: PlanSubscriptionsRepository,
    private readonly planPriceService: PlanPricesService,
    private readonly requestService: RequestService,
    private readonly planService: PlansService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly helpers: Helpers,
  ) {
    this.logger.channel('subscriptions');
  }

  async initiate({
    plan_price_id,
    success_url,
    cancel_url,
    payment_method,
  }: InitiatePlanSubscriptionRequest): Promise<HandleSubscriptionProcessResponse> {
    const paymentMethod = await this.paymentMethodsService.getOne(payment_method);
    if(!paymentMethod || !paymentMethod.enabled){
      throw new HttpException('Payment method not available', 422); 
    }
    // return paymentMethod;
    const planPrice = await this.planPriceService.findOne(plan_price_id);
    if (!planPrice) {
      throw new HttpException('Plan price does not exist', 422);
    }
    const currentUserSubscription =
      await this.planSubscriptionsRepository.findActiveSubscription(
        this.requestService.user.id,
      );
    if (currentUserSubscription?.plan_price_id === planPrice.id) {
      //This endpoint is only for downgrades or upgrades from a paid plan
      throw new HttpException("User already has this plan",HttpStatus.BAD_REQUEST);
    }
    if (planPrice.plan.is_free) {
      //This should be handle by a cancel method
      //Frontend should avoid request when is the free plan
      throw new HttpException("Cannot activate a free plan.",HttpStatus.BAD_REQUEST);
    }
    const data: HandleSubscriptionProcessInput = {
      currentUserSubscription,
      newPlanPrice: planPrice,
      successUrl: success_url,
      cancelUrl: cancel_url,
    };
    switch (payment_method) {
      case 'CARD':
        //STRIPE
        return await this.handleStripeSubscription(data);
      case 'PAYPAL':
        return await this.handlePaypalSubscription(data);
    }
  }

  async findActiveSubscription(userId: number) {
    return await this.planSubscriptionsRepository.findActiveSubscription(
      userId,
    );
  }
  async handleStripeSubscription({
    currentUserSubscription,
    newPlanPrice,
    successUrl,
    cancelUrl,
  }: HandleSubscriptionProcessInput) {
    const customerId = this.requestService.user?.stripe_customer_id;

    // Validate required Stripe IDs
    if (!customerId) {
      throw new HttpException(
        'Your account is still being set up. Please try again in a moment.',
        422,
      );
    }

    if (!newPlanPrice?.stripe_id) {
      throw new HttpException('This plan is not available for purchase.', 422);
    }
    try {
      const stripeSubscription = currentUserSubscription.stripe_id? await stripe.subscriptions.retrieve(currentUserSubscription.stripe_id):null;

      const paymentMethods =
        await StripeService.getUserPaymentMethod(customerId);
      const hasCompleteSubscription =
        currentUserSubscription &&
        currentUserSubscription?.stripe_id &&
        currentUserSubscription?.stripe_item_id &&
        stripeSubscription &&
       ( stripeSubscription.status === 'active' || stripeSubscription.status ==='trialing')
        paymentMethods.length > 0;
      if (!hasCompleteSubscription) {
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
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        return {
          ok: true,
          redirect_url: session.url,
          message: 'Need to checkout',
          stripe_error: null,
        };
      }
      const isUpgrade =
        currentUserSubscription.plan_price.price < newPlanPrice.price;

      await stripe.subscriptions.update(currentUserSubscription.stripe_id, {
        items: [
          {
            id: currentUserSubscription.stripe_item_id,
            price: newPlanPrice.stripe_id,
          },
        ],
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
      return {
        ok: true,
        redirect_url: null,
        message: 'Subscription updated',
        stripe_error: null,
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
        Helpers.callback500ErrorMail('error', errorMessage, stripeError || error);
      }
      if (stripeError) {
        return {
          ok: false,
          redirect_url: null,
          message:
            stripeError?.message || 'Something went wrong, try again later',
          stripe_error: stripeError,
        };
      }
    }
  }

  async handlePaypalSubscription({
    currentUserSubscription,
    newPlanPrice,
    successUrl,
    cancelUrl,
  }: HandleSubscriptionProcessInput) {
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
          brand_name: 'THSTUDIO',
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
      };
    }

    //downgrade

    return {
      message: '',
      ok: true,
      paypal_error: {},
      redirect_url: null,
    };
  }

  async setFreeSubscription(user: BaseUser) {
    //Plans with plan and plan prices must always exist. If not, BIG PROBLEM.
    const freePlan = await this.planService.findFreePlan();
    if (!freePlan) {
      throw new HttpException('Free plan not found', 500);
    }
    const lifetimePrice = freePlan.prices.find(
      (price) => price.billing_type === 'LIFETIME',
    );
    if (!lifetimePrice) {
      throw new HttpException('Lifetime price not found', 500);
    }

    await this.desactivateAllUserSubscriptions(user.id);

    return await this.create({
      is_active: true,
      is_trialing: false,
      amount: 0,
      payment_method: 'CARD',
      start_billing_date: new Date(),
      next_billing_date: this.helpers.getNextBillingDate(
        lifetimePrice.billing_type,
      ),
      user_id: user.id,
      stripe_id: null,
      stripe_item_id: null,
      auto_renewal: true,
      paypal_id: null,
      plan_offer_id: null,
      plan_price_id: lifetimePrice.id,
    });
  }
  async create(planData: CreatePlanSubscriptionInput) {
    const planSubScription =
      await this.planSubscriptionsRepository.create(planData);

    return planSubScription;
  }

  async desactivateAllUserSubscriptions(
    userId: string | number,
    skipSubscriptions: number[] = [],
  ) {
    await this.planSubscriptionsRepository.update(
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
            ? [{ column: 'id', operator: 'NOT IN' as const, value: skipSubscriptions }]
            : []),
        ],
      },
    );
  }

 async  findAll() {
    return `This action returns all plan subscriptions`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} plan subscription`;
  }


  async update(
    id: number,
    updatePlanSubscriptionDto: UpdatePlanSubscriptionInput,
  ) {
    return this.planSubscriptionsRepository.updateOne(
      id,
      updatePlanSubscriptionDto,
    );
  }

  remove(id: number) {
    return `This action removes a #${id} plan subscription`;
  }
}
