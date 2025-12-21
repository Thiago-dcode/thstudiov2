import { Module } from '@nestjs/common';
import { UserCategoriesController } from './user-categories.controller';
import { CategoriesService } from '../categories/categories.service';
import { CategoriesRepository } from '../categories/categories.repository';

@Module({
  controllers: [UserCategoriesController],
  providers: [CategoriesService, CategoriesRepository],
})
export class UserCategoriesModule {}
