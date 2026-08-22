import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { PlansRepository } from './plans.repository';
import { IndexPlanRequest } from './requests/index-plan.request';
import { Helpers } from 'src/common/services/helpers.service';
import {
  CACHE_KEY_PLANS,
  CACHE_KEY_FREE_PLAN,
  CACHE_KEY_ACTIVE_PLAN,
  CACHE_KEY_ACTIVE_PLANS_BASE,
} from '@repo/common-lib/constants/cache';

@Injectable()
export class PlansService {
  constructor(
    private readonly plansRepository: PlansRepository,
    private readonly helpers: Helpers,
  ) {}
  // create(createPlanDto: CreatePlanDto) {
  //   return 'This action adds a new plan';
  // }
  async findAll(indexPlanRequest: IndexPlanRequest) {
    return await this.helpers.cacheRemember(
      CACHE_KEY_PLANS,
      this.plansRepository.findAll(indexPlanRequest),
      {
        append_language: true,
        ttl: 1000 * 60 * 60 * 24,
      },
    );
  }

  async findActivePlans() {
    return await this.helpers.cacheRemember(
      CACHE_KEY_ACTIVE_PLANS_BASE,
      this.plansRepository.findActivePlans(),
      {
        append_language: false,
        ttl: 1000 * 60 * 60 * 24,
      },
    );
  }

  async findOne(id: number) {
    const result = await QueryBuilder.table('plans')
      .where('id', '=', id)
      .first();
    //TODO: create a response dto
    return result;
  }
  async findUserActivePlan(userId: number) {
    return await this.helpers.cacheRemember(
      CACHE_KEY_ACTIVE_PLAN(userId),
      this.plansRepository.findUserActivePlan(userId),
      {
        append_language: false,
        ttl: 1000 * 60 * 60 * 24,
      },
    );
  }
  async findFreePlan() {
    return await this.helpers.cacheRemember(
      CACHE_KEY_FREE_PLAN,
      this.plansRepository.findFreePlan(),
      {
        append_language: true,
        ttl: 1000 * 60 * 60 * 24,
      },
    );
    //TODO: create a response dto
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
