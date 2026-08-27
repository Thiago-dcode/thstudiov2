import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { PlansRepository as BasePlansRepository } from '@repo/database/repositories/plans';
import {
  FullPlanColumns,
  FullPlanSchema,
  PlanWithPricesSchema,
} from '@repo/common-lib/schemas/plan';
import { FullPlan, PlanPrice } from '@repo/common-lib/types/plan';
import { RequestService } from 'src/common/services/request.service';
import { IndexPlanRequest } from './requests/index-plan.request';

/**
 * HTTP-facing plans repository: language-filtered listing + translated formatting.
 * Limit-check / worker methods live on the database base class.
 */
@Injectable()
export class PlansRepository extends BasePlansRepository {
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
    super();
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
}
