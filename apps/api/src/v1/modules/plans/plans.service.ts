import { Injectable } from '@nestjs/common';
import { QueryBuilder } from '@repo/database/queryBuilder';
import { PlansRepository } from './plans.repository';
import { IndexPlanRequest } from './requests/index-plan.request';

@Injectable()
export class PlansService {
  constructor(private readonly plansRepository: PlansRepository) {}
  // create(createPlanDto: CreatePlanDto) {
  //   return 'This action adds a new plan';
  // }

  async findAll(indexPlanRequest: IndexPlanRequest) {
    const result = await this.plansRepository.findAll(indexPlanRequest);
    //TODO: createa a response dtof
    return result;
  }

  async findOne(id: number) {
    const result = await QueryBuilder.table('plans')
      .where('id', '=', id)
      .first();
    //TODO: create a response dto
    return result;
  }
  async findFreePlan() {
    const result =await this.plansRepository.findFreePlan();
    //TODO: create a response dto
    return result;
  }

  // update(id: number, updatePlanDto: UpdatePlanDto) {
  //   return `This action updates a #${id} plan`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} plan`;
  // }
}
