import { Injectable } from '@nestjs/common';
import { IndexCategoriesRequest } from './requests/index-categories.request';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoriesRepository) {}
  // create(createPlanDto: CreatePlanDto) {
  //   return 'This action adds a new plan';
  // }
  async findAll(indexCategoriesRequest: IndexCategoriesRequest) {
    const result = await this.categoryRepository.findAll(indexCategoriesRequest);
    //TODO: createa a response dtof
    return result;
  }

  async findAllUserCategories(userId:number) {
    const result = await this.categoryRepository.findAll({
      paginated:false,
      user_id:userId,
    });
    //TODO: createa a response dtof
    return result;
  }
}
