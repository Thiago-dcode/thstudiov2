import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { IndexPlanRequest } from './requests/index-plan.request';
import { BaseRepository } from '@repo/database/repositories';
import { PlanSchema, CreatePlanInput, FullPlanColumns, FullPlanSchema, PlanWithPricesColumns, PlanWithPricesSchema } from '@repo/common-lib/schemas/plan';
import {
} from '@repo/common-lib/schemas/plan-price';
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
    'plans.max_services',
    'plans.max_media_size',
    'plans.limit_write_storage_per_day',
    'plans.powered_by_ai',
    'plans.is_active',
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

  constructor(private readonly requestService: RequestService) {
    super('plans');
  }
  private init() {
    this.queryBuilder.select(this.COLUMNS);
    this.queryBuilder.join('id', 'plan_prices', 'plan_id', 'INNER');
    this.queryBuilder.join('id', 'plan_translations', 'plan_id', 'INNER');
    this.queryBuilder.where(
      'plan_translations.language_code',
      '=',
      this.requestService.language,
    );
  }
  async findAll(filters: IndexPlanRequest) {
    this.init();
    this.applyFilters(filters);
    const result = await this.queryBuilder.get<FullPlanSchema[]>();
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
        const planPrices: {
          [id: number]: PlanPrice;
        } = {};
        for (let idx = 0; idx < fullPlanSchema.length; idx++) {
          const plan = fullPlanSchema[idx];
          if (curr.id !== plan.plan_id || planPrices[plan.pp_id]) continue;
          planPrices[plan.pp_id] = {
            id: plan.pp_id,
            price: plan.price,
            paypal_id:plan.pp_paypal_id,
            stripe_id:plan.pp_stripe_id,
            plan_id: curr.id,
            billing_type: plan.billing_type,
          };
        }
        acc[curr.id] = {
          id: curr.id,
          name: curr.name,
          short_description: curr.short_description,
          description: curr.description,
          logo: null,
          base_price: curr.base_price,
          paypal_id:curr.paypal_id,
          stripe_id:curr.stripe_id,
          prices: Object.values(planPrices),
          is_active: curr.is_active,
          is_free: curr.is_free,
          is_popular: curr.is_popular,
          powered_by_ai: curr.powered_by_ai,
          allow_media_compression: curr.allow_media_compression,
          max_clients: curr.max_clients,
          max_portfolios: curr.max_portfolios,
          max_projects: curr.max_projects,
          max_services: curr.max_services,
          max_media_size: curr.max_media_size,
          limit_write_storage_per_day: curr.limit_write_storage_per_day,
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
  async applyFilters(filters: IndexPlanRequest) {
    if (filters.is_active !== undefined) {
      this.queryBuilder.where('is_active', '=', filters.is_active);
    }
  }

  async findOne(id: number) {
    const result = await QueryBuilder.table('plans')
      .where('id', '=', id)
      .first();
    //TODO: create a response dto
    return result;
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
  async create(plan: CreatePlanInput) {
    const columns = Object.keys(plan);
    const values = Object.values(plan);
    return await this.queryBuilder.insertAndGet<PlanSchema>(columns, values);
    //TODO: create a response dto
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
