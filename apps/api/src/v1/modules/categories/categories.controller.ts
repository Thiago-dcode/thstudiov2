import { Controller, Get, Query } from '@nestjs/common';
import { IndexCategoriesRequest } from './requests/index-categories.request';
import { CategoriesService } from './categories.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  findAll(@Query() indexCategoriesRequest: IndexCategoriesRequest) {
    return this.categoriesService.findAll(indexCategoriesRequest);
  }
}
