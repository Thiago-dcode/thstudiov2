import { HttpException, Injectable } from '@nestjs/common';
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
import { FullPlanSubscription } from '@repo/common-lib/types/plan-subscription';
import Utils from 'src/common/services/Utils.service';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { FullPlanPrice } from '@repo/common-lib/types/plan-price';
import { UserService } from '../users/users.service';

@Injectable()
export class PlanSubscriptionsService {
  constructor(
    private readonly planSubscriptionsRepository: PlanSubscriptionsRepository,
    private readonly userService: UserService,
    private readonly planPriceService: PlanPricesService,
    private readonly requestService: RequestService,
    private readonly planService: PlansService,
    private readonly utils: Utils,
  ) {}

  async initiate({
    plan_price_id,
    success_url,
    cancel_url,
    payment_method,
  }: InitiatePlanSubscriptionRequest) {
    const planPrice = await this.planPriceService.findOne(plan_price_id);
    if (!planPrice) {
      throw new HttpException('Plan price does not exist', 422);
    }
    const currentUserSubscription =
      await this.planSubscriptionsRepository.getActiveUserSubscription(
        this.requestService.user.id,
      );
  
    if (currentUserSubscription?.plan_price_id === planPrice.id) {
      return {
        ok: false,
        redirect_url: null,
        message: 'Already subscribed to this plan',
      };
    }
    if (planPrice.plan.is_free) {
      await this.setFreePlan(this.requestService.user);
      return {
        ok: true,
        redirect_url: null,
        message: 'Free plan activated',
      };
    }
  
    switch (payment_method) {
      case 'CARD':
        //STRIPE
        return await this.handleStripeSubscription({
          currentUserSubscription,
          planPrice,
          successUrl: success_url,
          cancelUrl: cancel_url,
        });
      case 'PAYPAL':
        //TODO
        break;
    }
  }

  async getActiveUserSubscription(userId:number){
return await this.planSubscriptionsRepository.getActiveUserSubscription(userId)
  }
  async handleStripeSubscription({
    currentUserSubscription,
    planPrice,
    successUrl,
    cancelUrl,
  }: {
    currentUserSubscription: FullPlanSubscription | null;
    planPrice: FullPlanPrice;
    successUrl: string;
    cancelUrl: string;
  }) {
    const customerId = this.requestService.user?.stripe_customer_id;

  // Validate required Stripe IDs
  if (!customerId) {
    throw new HttpException(
      'Your account is still being set up. Please try again in a moment.',
      422,
    );
  }

  if (!planPrice?.stripe_id) {
    throw new HttpException('This plan is not available for purchase.', 422);
  }

    const paymentMethods =  await this.userService.getStripePaymentMethods(customerId);
    const hasCompleteSubscription = currentUserSubscription &&
    currentUserSubscription?.stripe_id && 
    currentUserSubscription?.stripe_item_id &&
    paymentMethods.length > 0;
    if (!hasCompleteSubscription) {
      // Cancel any orphaned Stripe subscription before creating new one
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: planPrice?.stripe_id,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return {
        ok: true,
        redirect_url: session.url,
        message:"Need to checkout"
      };
    }
    // User already has an active subscription - update the plan/price directly
    // Note: With 'always_invoice', Stripe creates an invoice for the prorated amount.
    // If payment fails, the subscription won't be updated on Stripe's side.
    // The local DB update is handled by the webhook (customer.subscription.updated)
    // which only fires after successful payment, ensuring data consistency.
    try {
      const isUpgrade = 
        currentUserSubscription.plan_price.price < planPrice.price;
      await stripe.subscriptions.update(
        currentUserSubscription.stripe_id,
        {
          items: [
            {
              id: currentUserSubscription.stripe_item_id,
              price: planPrice.stripe_id,
            },
          ],
          proration_behavior: isUpgrade ? 'create_prorations' : 'none',
          payment_behavior:isUpgrade? 'error_if_incomplete':undefined,
          billing_cycle_anchor: isUpgrade? undefined:'unchanged',
        },
      );
      return {
        ok: true,
        redirect_url: null,
        message: 'Subscription updated',
      };
    } catch (error) {
      console.log(error);
      const stripeError = error as { type?: string };
      if (stripeError.type === 'StripeCardError') {
        throw new HttpException(
          'Payment failed. Please update your payment method.',
          402,
        );
      }
      throw new HttpException(
        'Failed to update subscription. Please try again.',
        500,
      );
    }
  }

  async setFreePlan(user: BaseUser) {
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
    const currentUserSubscription =
      await this.planSubscriptionsRepository.getActiveUserSubscription(
        this.requestService.user.id,
      );
    if (currentUserSubscription?.stripe_id) {
      await stripe.subscriptions.cancel(currentUserSubscription.stripe_id);
    }
    if (currentUserSubscription?.paypal_id) {
      //TODO
    }
    //A user can only have 1 subscription active
    await this.desactivateAllUserSubscriptions(user.id);

    return await this.create({
      is_active: true,
      is_trialing: false,
      amount: 0,
      payment_method: 'CARD',
      start_billing_date: new Date(),
      next_billing_date: this.utils.getNextBillingDate(
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

  async desactivateAllUserSubscriptions(userId: string | number) {
    await this.planSubscriptionsRepository.update(
      {
        is_active: false,
      },
      {
        wheres: [
          {
            column: 'user_id',
            operator: '=',
            type: 'where',
            value: userId,
          },
        ],
      },
    );
  }

  async findOneByStripeId(stripeId: string) {
    return this.planSubscriptionsRepository.findOneByColumn(
      'stripe_id',
      stripeId,
    );
  }
  async findOneByPaypalId(stripeId: string) {
    return this.planSubscriptionsRepository.findOneByColumn(
      'paypal_id',
      stripeId,
    );
  }

  findAll() {
    return `This action returns all plan subscriptions`;
  }

  findOne(id: number) {
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
