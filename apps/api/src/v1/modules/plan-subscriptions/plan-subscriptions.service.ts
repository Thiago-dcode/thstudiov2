import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { UpdatePlanSubscriptionRequest } from './requests/update-plan-subscription.request';
import { CreatePlanSubscriptionRequest } from './requests/create-plan-subscription.request';
import { InitiatePlanSubscriptionRequest } from './requests/initiate-plan-subscription.request';
import { TransactionsService } from '../transactions/transactions.service';
import { PlanPricesService } from '../plan-prices/plan-prices.service';
import { RequestService } from 'src/common/services/request.service';
import { PlansService } from '../plans/plans.service';
import { addMonths, addYears } from 'date-fns';
import { BaseUser } from '@repo/common-lib/types/user';
import { CreatePlanSubscriptionInput } from '@repo/common-lib/schemas/plan-subscription';

@Injectable()
export class PlanSubscriptionsService {
  constructor(
    private readonly planSubscriptionsRepository: PlanSubscriptionsRepository,
    private readonly planPriceService: PlanPricesService,
    private readonly requestService: RequestService,
    private readonly planService: PlansService,
    private readonly transactionService: TransactionsService,
  ) {}

  async initiate({ plan_price_id }: InitiatePlanSubscriptionRequest) {
    //TODO: fetch plan price
    const planPrice = await this.planPriceService.findOne(plan_price_id);
    if (!planPrice) {
      throw new HttpException('Plan price does not exist', 422);
    }
    if (planPrice.plan.is_free) {
      return await this.setFreePlan(this.requestService.user);
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
      throw new HttpException(
        'Lifetime price not found',
        HttpStatus.BAD_REQUEST,
      );
    }
    const transaction = await this.transactionService.create({
      amount: lifetimePrice.price,
      product_type: 'PLAN',
      user_id: user.id,
      plan_price_id: lifetimePrice.id,
      status: 'SUCCESS',
      payment_status: 'SUCCESS',
      payment_method: 'CARD',
    });
    return await this.createOrUpdate({
      is_active: true,
      user_id: user.id,
      stripe_id: null,
      auto_renewal: true,
      paypal_id: null,
      plan_id: freePlan.id,
      plan_offer_id: null,
      plan_price_id: lifetimePrice.id,
      transaction_id: transaction.id,
    });
  }

  async createOrUpdate(
    createPlanSubscriptionDto: CreatePlanSubscriptionRequest,
  ) {
    const planPrice = await this.planPriceService.findOne(
      createPlanSubscriptionDto.plan_price_id,
    );
    if (!planPrice) {
      throw new HttpException('No plan price found', HttpStatus.BAD_REQUEST);
    }
    const next_billing_date =
      planPrice.plan.is_free || planPrice.billing_type === 'YEARLY'
        ? addYears(new Date(), 1)
        : addMonths(new Date(), planPrice.billing_type === 'MONTHLY' ? 1 : 3);
    const data: CreatePlanSubscriptionInput = {
      start_billing_date: new Date(),
      next_billing_date: next_billing_date,
      stripe_id: createPlanSubscriptionDto.stripe_id ?? null,
      paypal_id: createPlanSubscriptionDto.paypal_id ?? null,
      auto_renewal: createPlanSubscriptionDto.auto_renewal ?? true,
      user_id: createPlanSubscriptionDto.user_id,
      plan_id: createPlanSubscriptionDto.plan_id,
      plan_price_id: createPlanSubscriptionDto.plan_price_id,
      plan_offer_id: createPlanSubscriptionDto.plan_offer_id ?? null,
      transaction_id: createPlanSubscriptionDto.transaction_id ?? null,
      is_active: createPlanSubscriptionDto.is_active ?? true,
    };
    //A user can only have 1 subscription. 1:1 relationship
    let planSubScription = await this.planSubscriptionsRepository.findOneByUser(
      data.user_id,
    );
    if (!planSubScription) {
      planSubScription = await this.planSubscriptionsRepository.create(data);
    } else {
      planSubScription = await this.planSubscriptionsRepository.updateOne(
        planSubScription.id,
        data,
      );
    }
    return planSubScription;
  }

  findAll() {
    return `This action returns all plan subscriptions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} plan subscription`;
  }

  update(id: number, updatePlanSubscriptionDto: UpdatePlanSubscriptionRequest) {
    console.log(id, updatePlanSubscriptionDto);
    return `This action updates a #${id} plan subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} plan subscription`;
  }
}
