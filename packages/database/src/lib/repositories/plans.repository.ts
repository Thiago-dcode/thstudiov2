import {
  PlanSchema,
  CreatePlanInput,
  PlanWithPricesColumns,
  PlanWithPricesSchema,
} from '@repo/common-lib/schemas/plan';
import { FullPlan, PlanPrice } from '@repo/common-lib/types/plan';
import { QueryBuilder } from '../builder/queryBuilder';
import { BaseRepository } from './base.repository';

/**
 * Nest-free plans repository for workers and limit checks.
 * Localized listing (plan_translations + RequestService) lives on the API subclass.
 */
export class PlansRepository extends BaseRepository {
  readonly BASE_COLUMNS: PlanWithPricesColumns[] = [
    'plans.id',
    'plans.base_price',
    'plans.name',
    'plans.short_description',
    'plans.description',
    'plans.is_free',
    'plans.stripe_id',
    'plans.paypal_id',
    'plans.is_popular',
    'plans.max_clients',
    'plans.max_projects',
    'plans.max_portfolios',
    'plans.max_collections',
    'plans.max_services',
    'plans.storage_limit_mb',
    'plans.limit_write_storage_per_day',
    'plans.ai_credits',
    'plans.is_active',
    'plans.top_tier',
    'plan_prices.price',
    'plan_prices.plan_id',
    'plan_prices.paypal_id as pp_paypal_id',
    'plan_prices.stripe_id as pp_stripe_id',
    'plan_prices.id as pp_id',
    'plan_prices.billing_type',
    'plans.allow_media_compression',
  ];

  constructor() {
    super('plans', {
      softDelete: true,
    });
  }

  static instance() {
    return new PlansRepository();
  }

  /**
   * Formats plan + price rows without translations (safe outside HTTP).
   */
  protected formatPlansWithPrices(
    rows: PlanWithPricesSchema[],
  ): Array<Omit<FullPlan, 'translation'>> {
    const _plans: {
      [id: number]: Omit<FullPlan, 'translation'>;
    } = rows.reduce(
      (acc, curr) => {
        if (acc[curr.id]) return acc;

        acc[curr.id] = {
          id: curr.id,
          name: curr.name,
          short_description: curr.short_description,
          description: curr.description,
          logo: null,
          base_price: curr.base_price,
          paypal_id: curr.paypal_id,
          stripe_id: curr.stripe_id,
          is_active: curr.is_active,
          prices: Object.values(
            rows.reduce(
              (p, c) => {
                if (c.plan_id != curr.id || p[c.pp_id]) return p;
                p[c.pp_id] = {
                  billing_type: c.billing_type,
                  id: c.pp_id,
                  paypal_id: c.pp_paypal_id,
                  plan_id: c.plan_id,
                  price: c.price,
                  stripe_id: c.pp_stripe_id,
                };
                return p;
              },
              {} as {
                [id: number]: PlanPrice;
              },
            ),
          ),
          is_free: curr.is_free,
          is_popular: curr.is_popular,
          top_tier: curr.top_tier,
          allow_media_compression: curr.allow_media_compression,
          max_clients: curr.max_clients,
          max_portfolios: curr.max_portfolios,
          max_projects: curr.max_projects,
          max_services: curr.max_services,
          max_collections: curr.max_collections,
          storage_limit_mb: curr.storage_limit_mb,
          limit_write_storage_per_day: curr.limit_write_storage_per_day,
          ai_credits: curr.ai_credits,
        };
        return acc;
      },
      {} as {
        [id: number]: Omit<FullPlan, 'translation'>;
      },
    );

    return Object.values(_plans);
  }

  async findOne(id: number) {
    const result = await QueryBuilder.table('plans')
      .where('id', '=', id)
      .first();
    //TODO: create a response dto
    return result;
  }

  /** Base plan rows only — no translation join, so it's safe to call outside a request context. */
  async findActivePlans(): Promise<PlanSchema[]> {
    return await QueryBuilder.table('plans')
      .where('is_active', '=', true)
      .get<PlanSchema[]>();
  }

  async findFreePlan(): Promise<Omit<FullPlan, 'translation'>> {
    const result = await QueryBuilder.table('plans')
      .select(this.BASE_COLUMNS)
      .where('is_free', '=', true)
      .where('is_active', '=', true)
      .join('id', 'plan_prices', 'plan_id')
      .get<PlanWithPricesSchema[]>();
    return this.formatPlansWithPrices(result)[0];
  }

  /**
   * Active subscription plan for a user. No plan_translations — language-neutral for
   * limit checks / workers. API subclass may override when a localized row is needed.
   */
  async findUserActivePlan(userId: number): Promise<Omit<FullPlan, 'translation'>> {
    const result = await this.query()
      .select(this.BASE_COLUMNS)
      .join('id', 'plan_prices', 'plan_id')
      .join('plan_prices.id', 'plan_subscriptions', 'plan_price_id')
      .where('plan_subscriptions.user_id', '=', userId)
      .where('plan_subscriptions.is_active', '=', true)
      .get<PlanWithPricesSchema[]>();
    return this.formatPlansWithPrices(result)[0];
  }

  async create(plan: CreatePlanInput) {
    const columns = Object.keys(plan);
    const values = Object.values(plan);
    return await this.query().insertAndGet<PlanSchema>(columns, values);
    //TODO: create a response dto
  }
}
