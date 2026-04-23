import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { CategoryTranslationsRepository } from './category-translations.repository';
import { CategoryTranslationsService } from './category-translations.service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoryTranslationsRepository,
    CategoryTranslationsService,
    CategoriesRepository,
    CategoriesService,
    {
      provide: LogService,
      useFactory: (requestService: RequestService) => {
        return FactoryLogService.createLogService('file', {
          channel: 'categories',
          id: () => requestService.requestId,
        });
      },
      inject: [RequestService],
    },
  ],
  exports: [CategoriesService, CategoryTranslationsService],
})
export class CategoriesModule {}
