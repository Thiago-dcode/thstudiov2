import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { CategoryTranslationsRepository } from './category-translations.repository';
import { CategoryTranslationsService } from './category-translations.service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { createApiLogger } from 'src/common/utils/api-logger';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoryTranslationsRepository,
    CategoryTranslationsService,
    CategoriesRepository,
    CategoriesService,
    {
      provide: LogService,
      useFactory: () => {
        return createApiLogger({
          channel: 'categories',
        });
      },
    },
  ],
  exports: [CategoriesService, CategoryTranslationsService],
})
export class CategoriesModule {}
