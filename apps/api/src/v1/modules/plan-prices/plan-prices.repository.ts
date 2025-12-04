import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { BaseRepository } from '@repo/database/repositories';
import {
  PlanPriceWithPlanColumns,
  PlanPriceWithPlanSchema,
} from '@repo/common-lib/schemas/plan-price';
import { FullPlanPrice } from '@repo/common-lib/types/plan-price';

@Injectable()
export class PlanPricesRepository extends BaseRepository {
  private readonly COLUMNS: PlanPriceWithPlanColumns[] = [
    // plan_prices fields
    'plan_prices.id',
    'plan_prices.stripe_id',
    'plan_prices.paypal_id',
    'plan_prices.plan_id',
    'plan_prices.price',
    'plan_prices.billing_type',
    // plans colliding fields (prefixed)
    'plans.id as p_id',
    'plans.stripe_id as p_stripe_id',
    'plans.paypal_id as p_paypal_id',
    // plans non-colliding fields
    'plans.name',
    'plans.short_description',
    'plans.base_price',
    'plans.is_active',
    'plans.is_free',
  ];

  constructor() {
    super('plan_prices');
  }

  async findOne(id: number): Promise<FullPlanPrice | null> {
    const result = await QueryBuilder.table('plan_prices')
      .select(this.COLUMNS)
      .join('plan_id', 'plans', 'id')
      .where('plan_prices.id', '=', id)
      .first<PlanPriceWithPlanSchema>();
    if (!result) return null;

    return {
      id: result.id,
      billing_type: result.billing_type,
      plan_id: result.plan_id,
      price: result.price,
      plan: {
        id: result.p_id,
        name: result.name,
        base_price: result.base_price,
        is_free: result.is_free,
        is_active: result.is_active,
        short_description: result.short_description,
      },
    };
  }
}
