import { Controller, Get, Param, UsePipes } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { IsNumberPipe } from 'src/pipes/is-number.pipe';
import { ModelExistPipe } from 'src/pipes/model-exist.pipe';
import { CategoriesService } from '../categories/categories.service';

@Controller('users/:id/categories')
export class UserCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @UsePipes(new IsNumberPipe(true), new ModelExistPipe('users'))
  findAll(@Param('id') id: number) {
    return this.categoriesService.findAllUserCategories(id);
  }
}
