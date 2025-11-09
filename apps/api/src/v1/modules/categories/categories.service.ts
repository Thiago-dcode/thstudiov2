import { Injectable } from '@nestjs/common';
import { IndexCategoriesRequest } from './requests/index-categories.request';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly plansRepository: CategoriesRepository) {}
  // create(createPlanDto: CreatePlanDto) {
  //   return 'This action adds a new plan';
  // }
  async findAll(indexCategoriesRequest: IndexCategoriesRequest) {
    const result = await this.plansRepository.findAll(indexCategoriesRequest);
    //TODO: createa a response dtof
    return result;
  }
}
