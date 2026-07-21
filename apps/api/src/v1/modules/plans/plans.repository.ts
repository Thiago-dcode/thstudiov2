import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { IndexPlanRequest } from './requests/index-plan.request';
import { BaseRepository } from '@repo/database/repositories';
import {
  PlanSchema,
  CreatePlanInput,
  FullPlanColumns,
  FullPlanSchema,
  PlanWithPricesColumns,
  PlanWithPricesSchema,
} from '@repo/common-lib/schemas/plan';
import { } from '@repo/common-lib/schemas/plan-price';
import { RequestService } from 'src/common/services/request.service';
import { FullPlan, PlanPrice } from '@repo/common-lib/types/plan';

@Injectable()
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
  readonly COLUMNS: FullPlanColumns[] = [
    ...this.BASE_COLUMNS,
    'plan_translations.id as pt_id',
    'plan_translations.plan_id as pt_plan_id',
    'plan_translations.language_code',
    'plan_translations.name as pt_name',
    'plan_translations.short_description as pt_short_description',
    'plan_translations.description as pt_description',
  ];

  constructor(private readonly requestService: RequestService, protected readonly logService: LogService) {
    super('plans', logService, {
      softDelete: true,
    });
  }
  private initQuery() {
    const query = this.query().select(this.COLUMNS);
    query.join('id', 'plan_prices', 'plan_id', 'INNER');
    query.join('id', 'plan_translations', 'plan_id', 'INNER');
    query.where(
      'plan_translations.language_code',
      '=',
      this.requestService.language,
    );

    return query;
  }
  async findAll(filters: IndexPlanRequest) {
    const query = this.initQuery();
    await this.applyFilters(filters, query);
    const result = await query.get<FullPlanSchema[]>();
    return this.formatPlans(result);
  }
  private formatPlans(
    fullPlanSchema: PlanWithPricesSchema[] | FullPlanSchema[],
  ): FullPlan[] {
    const _plans: {
      [id: number]: FullPlan;
    } = fullPlanSchema.reduce(
      (acc, curr) => {
        if (acc[curr.id]) return acc;
        const translation = Object.hasOwn(curr, 'language_code')
          ? (fullPlanSchema as FullPlanSchema[]).find(
            (p) =>
              p.pt_plan_id == curr.id &&
              this.requestService.language === p.language_code,
          )
          : undefined;

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
            fullPlanSchema.reduce(
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
          translation: translation
            ? {
              id: translation.pt_id,
              code: translation.language_code,
              plan_id: curr.plan_id,
              short_description: translation.pt_short_description,
              description: translation.pt_description,
              name: translation.pt_name,
            }
            : undefined,
        };
        return acc;
      },
      {} as {
        [id: number]: FullPlan;
      },
    );

    return Object.values(_plans);
  }
  protected async applyFilters(filters: IndexPlanRequest, query: QueryBuilder) {
    if (filters.is_active !== undefined) {
      query.where('is_active', '=', filters.is_active);
    }
    return query;
  }

  async findOne(id: number) {
    const result = await QueryBuilder.table('plans')
      .where('id', '=', id)
      .first();
    //TODO: create a response dto
    return result;
  }
  /** Base plan rows only — no translation join, so it's safe to call outside a request context (e.g. queue processors). */
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
    return this.formatPlans(result)[0];
  }

  async findUserActivePlan(userId: number) {
    const result = await this.query()
      .select(this.BASE_COLUMNS)
      .join('id', 'plan_prices', 'plan_id')
      .join('id', 'plan_translations', 'plan_id')
      .join('plan_prices.id', 'plan_subscriptions', 'plan_price_id')
      .where('plan_subscriptions.user_id', '=', userId)
      .where('plan_subscriptions.is_active', '=', true)
      .get();
    return this.formatPlans(result)[0];
  }
  async create(plan: CreatePlanInput) {
    const columns = Object.keys(plan);
    const values = Object.values(plan);
    return await this.query().insertAndGet<PlanSchema>(columns, values);
    //TODO: create a response dto
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
