import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { IndexPlanRequest } from './requests/index-plan.request';
import { BaseRepository } from '@repo/database/repositories';
import { BasePlanWithPrices } from './plans.types';
import { Plan, PlanPrice } from '@repo/database/types/plans';

@Injectable()
export class PlansRepository extends BaseRepository {
  constructor() {
    super('plans');
  }

  async findAll(filters: IndexPlanRequest) {
    return await super.findAll(filters);
  }
  async applyFilters(filters: IndexPlanRequest) {
    if (filters.search) {
      this.queryBuilder.where('name', 'LIKE', `%${filters.search}%`);
    }
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
  async findFreePlan(): Promise<BasePlanWithPrices> {
    console.log('findFreePlan');
    const result = await QueryBuilder.table('plans')
      .select([
        'id',
        'name',
        'description',
        'is_active',
        'is_free',
        'logo',
        'base_price',
        'plan_prices.id as plan_price_id',
        'plan_prices.price',
        'plan_prices.billing_type',
      ])
      .where('is_free', '=', true)
      .where('is_active', '=', true)
      .join('id', 'plan_prices', 'plan_id')
      .get<(Plan & Exclude<PlanPrice, 'id'> & { plan_price_id: number })[]>();
    //TODO: create a response dto
    const basePlanWithPrices: BasePlanWithPrices = {
      id: result[0].id,
      name: result[0].name,
      description: result[0].description,
      is_active: result[0].is_active,
      is_free: result[0].is_free,
      logo: result[0].logo,
      base_price: result[0].base_price,
      prices: result.map((price) => ({
        id: price.plan_price_id,
        price: price.price,
        billing_type: price.billing_type,
      })),
    };

    return basePlanWithPrices;
  }
  async create(plan: any) {
    console.log(plan);
    //TODO: create a response dto
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
