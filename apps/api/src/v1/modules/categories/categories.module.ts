import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { CategoryTranslationsRepository } from './category-translations.repository';
import { CategoryTranslationsService } from './category-translations.service';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoryTranslationsRepository,
    CategoryTranslationsService,
    CategoriesRepository,
    CategoriesService,
  ],
  exports: [CategoriesService, CategoryTranslationsService],
})
export class CategoriesModule {}
