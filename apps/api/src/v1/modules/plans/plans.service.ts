import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { PlansRepository } from './plans.repository';
import { IndexPlanRequest } from './requests/index-plan.request';
import {Helpers} from 'src/common/services/helpers.service';

@Injectable()
export class PlansService {
  constructor(private readonly plansRepository: PlansRepository,private readonly helpers: Helpers) {}
  // create(createPlanDto: CreatePlanDto) {
  //   return 'This action adds a new plan';
  // }
  async findAll(indexPlanRequest: IndexPlanRequest) {
    return await this.helpers.cacheRemember('plans',this.plansRepository.findAll(indexPlanRequest),{
      append_language:true,
      ttl:1000*60*60*24
    });
  }

  async findOne(id: number) {
    const result = await QueryBuilder.table('plans')
      .where('id', '=', id)
      .first();
    //TODO: create a response dto
    return result;
  }
  async findFreePlan() {
    return await this.helpers.cacheRemember('free-plan',this.plansRepository.findFreePlan(),{
      append_language:true,
      ttl:1000*60*60*24
    });
    //TODO: create a response dto
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
