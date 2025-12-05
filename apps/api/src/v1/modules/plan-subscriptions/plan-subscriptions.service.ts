import { HttpException, Injectable } from '@nestjs/common';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { UpdatePlanSubscriptionRequest } from './requests/update-plan-subscription.request';
import { InitiatePlanSubscriptionRequest } from './requests/initiate-plan-subscription.request';
import { PlanPricesService } from '../plan-prices/plan-prices.service';
import { RequestService } from 'src/common/services/request.service';
import { PlansService } from '../plans/plans.service';
import { BaseUser } from '@repo/common-lib/types/user';
import { CreatePlanSubscriptionInput } from '@repo/common-lib/schemas/plan-subscription';
import Utils from 'src/common/services/Utils.service';

@Injectable()
export class PlanSubscriptionsService {
  constructor(
    private readonly planSubscriptionsRepository: PlanSubscriptionsRepository,
    private readonly planPriceService: PlanPricesService,
    private readonly requestService: RequestService,
    private readonly planService: PlansService,
    private readonly utils: Utils,
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
        500,
      );
    }
   //A user can only have 1 subscription active
   await this.desactivateAllUserSubscriptions(user.id);
   
    return await this.create({
      is_active: true,
      amount:0,
      payment_method:'CARD',
      payment_status:'SUCCESS',
      start_billing_date:new Date(),
      next_billing_date: this.utils.getNextBillingDate(lifetimePrice.billing_type),
      status:'SUCCESS',
      user_id: user.id,
      stripe_id: null,
      auto_renewal: true,
      paypal_id: null,
      plan_id: freePlan.id,
      plan_offer_id: null,
      plan_price_id: lifetimePrice.id,
    });
  }

  async create(
    planData: CreatePlanSubscriptionInput,
  ) {
   
    const planSubScription = await this.planSubscriptionsRepository.create(planData);
   
    return planSubScription;
  }

  async desactivateAllUserSubscriptions(userId:string|number){
    await this.planSubscriptionsRepository.update({
      is_active:false
    },{
      wheres:[{
        column:'user_id',
        operator:'=',
        type:'where',
        value:userId
      }]
    })

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
