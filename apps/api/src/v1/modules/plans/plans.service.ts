import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { PlansRepository } from './plans.repository';
import { IndexPlanRequest } from './requests/index-plan.request';
import Utils from 'src/common/services/Utils.service';

@Injectable()
export class PlansService {
  constructor(private readonly plansRepository: PlansRepository,private readonly utils: Utils) {}
  // create(createPlanDto: CreatePlanDto) {
  //   return 'This action adds a new plan';
  // }
  async findAll(indexPlanRequest: IndexPlanRequest) {
    return await this.utils.cacheRemember('plans',this.plansRepository.findAll(indexPlanRequest),{
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
    return await this.utils.cacheRemember('free-plan',this.plansRepository.findFreePlan(),{
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
