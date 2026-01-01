import { Injectable } from '@nestjs/common';
import { IndexCategoriesRequest } from './requests/index-categories.request';
import { CategoriesRepository } from './categories.repository';
import { Helpers } from 'src/common/services/helpers.service';
import { CACHE_KEY_USER_CATEGORIES } from '@repo/common-lib/constants/constants';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepository: CategoriesRepository, private readonly helpers:Helpers) {}
  // create(createPlanDto: CreatePlanDto) {
  //   return 'This action adds a new plan';
  // }
  async findAll(indexCategoriesRequest: IndexCategoriesRequest) {
    const result = await this.categoryRepository.findAll(indexCategoriesRequest);
    //TODO: createa a response dtof
    return result;
  }

  async findAllUserCategories(userId:number) {
   return this.helpers.cacheRemember(CACHE_KEY_USER_CATEGORIES(userId), this.categoryRepository.findAll({
    paginated:false,
    user_id:userId,
  }),{
   append_language:true,
   'ttl': 1000 * 60 * 60 * 24 
  })
    //TODO: createa a response dtof
  }
}
