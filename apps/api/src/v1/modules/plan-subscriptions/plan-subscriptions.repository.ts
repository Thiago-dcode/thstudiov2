import { Injectable } from '@nestjs/common';
import {
  CreatePlanSubscriptionInput,
  PlanSubscriptionColumns,
  PlanSubscriptionSchema,
  UpdatePlanSubscriptionInput,
  FullPlanSubscriptionColumns,
  FullPlanSubscriptionSchema,
} from '@repo/common-lib/schemas/plan-subscription';
import { SqlValue } from '@repo/common-lib/types/database';
import { FullPlanSubscription } from '@repo/common-lib/types/plan-subscription';
import { BaseRepository } from '@repo/database/repositories';

@Injectable()
export class PlanSubscriptionsRepository extends BaseRepository {
  private readonly BASE_COLUMNS: PlanSubscriptionColumns[] = [
    'plan_subscriptions.id',
    'plan_subscriptions.stripe_id',
    'plan_subscriptions.stripe_item_id',
    'plan_subscriptions.paypal_id',
    'plan_subscriptions.payment_method',
    'plan_subscriptions.amount',
    'plan_subscriptions.start_billing_date',
    'plan_subscriptions.next_billing_date',
    'plan_subscriptions.auto_renewal',
    'plan_subscriptions.user_id',
    'plan_subscriptions.plan_price_id',
    'plan_subscriptions.plan_offer_id',
    'plan_subscriptions.is_active',
    'plan_subscriptions.is_trialing',
  ];

  private readonly FULL_COLUMNS: FullPlanSubscriptionColumns[] = [
    // plan_subscriptions fields
    ...this.BASE_COLUMNS,
    // plan_prices colliding fields (prefixed)
    'plan_prices.id as pp_id',
    'plan_prices.stripe_id as pp_stripe_id',
    'plan_prices.paypal_id as pp_paypal_id',
    // plan_prices non-colliding fields
    'plan_prices.plan_id',
    'plan_prices.price',
    'plan_prices.billing_type',
    // plans colliding fields (prefixed)
    'plans.id as p_id',
    'plans.stripe_id as p_stripe_id',
    'plans.paypal_id as p_paypal_id',
    'plans.is_active as p_is_active',
    // plans non-colliding fields
    'plans.name',
    'plans.base_price',
    'plans.is_popular',
    'plans.is_free',
  ];

  constructor() {
    super('plan_subscriptions', {
      softDelete: true,
    });
  }

  formatFullPlanSubscription(
    result: FullPlanSubscriptionSchema,
  ): FullPlanSubscription {
    return {
      id: result.id,
      stripe_id: result.stripe_id,
      stripe_item_id: result.stripe_item_id,
      paypal_id: result.paypal_id,
      payment_method: result.payment_method,
      amount: result.amount,
      start_billing_date: result.start_billing_date,
      next_billing_date: result.next_billing_date,
      auto_renewal: result.auto_renewal,
      user_id: result.user_id,
      plan_price_id: result.plan_price_id,
      plan_offer_id: result.plan_offer_id,
      is_active: result.is_active,
      is_trialing: result.is_trialing,
      plan_price: {
        id: result.pp_id,
        stripe_id: result.pp_stripe_id,
        paypal_id: result.pp_paypal_id,
        plan_id: result.plan_id,
        price: result.price,
        billing_type: result.billing_type,
        plan: {
          id: result.p_id,
          stripe_id: result.p_stripe_id,
          paypal_id: result.p_paypal_id,
          is_active: result.p_is_active,
          name: result.name,
          base_price: result.base_price,
          is_popular: result.is_popular,
          is_free: result.is_free,
        },
      },
    };
  }
  async create(plan: CreatePlanSubscriptionInput) {
    const columns = Object.keys(plan);
    const values = Object.values(plan);
    return await this.query().insertAndGet<PlanSubscriptionSchema>(
      columns,
      values,
    );
  }

  async updateOne(id: string | number, plan: UpdatePlanSubscriptionInput) {
    await super.updateOne(id, plan);
    return this.query()
      .where('id', '=', id)
      .first<PlanSubscriptionSchema | null>();
  }

  async findOneByColumn(colName: string, value: SqlValue) {
    return this.query()
      .where(colName, '=', value)
      .first<PlanSubscriptionSchema | null>();
  }

  async findActiveSubscription(
    userId: number,
  ): Promise<FullPlanSubscription | null> {
    this.query().reset();
    const result = await this.query()
      .select(this.FULL_COLUMNS)
      .join('plan_price_id', 'plan_prices', 'id')
      .join('plan_prices.plan_id', 'plans', 'id')
      .where('plan_subscriptions.is_active', '=', true)
      .where('plan_subscriptions.user_id', '=', userId)
      .first<FullPlanSubscriptionSchema>();

    if (!result) return null;
    return this.formatFullPlanSubscription(result);
  }
}
