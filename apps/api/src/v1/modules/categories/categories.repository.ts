import { Injectable } from '@nestjs/common';
import { IndexCategoriesRequest } from './requests/index-categories.request';
import { BaseRepository } from '@repo/database/repositories';
import { RequestService } from 'src/common/services/request.service';
import {
  CategoryWithTranslationSchemaColumns,
  CategoryWithTranslationsSchema,
} from '@repo/common-lib/schemas/category';
import { CategoryBase } from '@repo/common-lib/types/category';

@Injectable()
export class CategoriesRepository extends BaseRepository {
  constructor(private readonly requestService: RequestService) {
    super('categories');
  }
  private readonly BASE_COLUMNS: CategoryWithTranslationSchemaColumns[] = [
    'categories.id',
    'categories.name',
    'categories.parent_id',
    'categories.tags',
    'category_translations.id as tr_id',
    'category_translations.name as tr_name',
    'category_translations.language_code',
  ];
  async findAll(filters: IndexCategoriesRequest) {
    this.queryBuilder.select(this.BASE_COLUMNS);

    await this.applyFilters(filters);

    const result =
      await this.queryBuilder.get<CategoryWithTranslationsSchema[]>();
    return this.formatCategories(result);
  }
  private formatCategories(
    result: CategoryWithTranslationsSchema[],
  ): CategoryBase[] {
    const categories: {
      [id: number]: CategoryBase;
    } = {};
    for (let i = 0; i < result.length; i++) {
      const {
        id,
        tr_id,
        name,
        tags,
        language_code,
        parent_id,
        thumbnail,
        tr_name,
      } = result[i];
      if (this.requestService.language !== language_code) continue;
      categories[id] = {
        id,
        tags: tags ? tags.split(',') : [],
        name,
        parent_id,
        thumbnail,
        translation: {
          id: tr_id,
          name: tr_name,
          code: language_code,
        },
      };
    }

    return Object.values(categories);
  }
  async applyFilters(filters: IndexCategoriesRequest) {
    this.queryBuilder.join(
      'id',
      'category_translations',
      'category_id',
      'LEFT',
    );

    // Always filter by language first
    this.queryBuilder.where(
      'category_translations.language_code',
      '=',
      this.requestService.language,
    );

    if (filters.search) {
      const search = filters.search.toLowerCase();
      // Use whereGroup to properly group OR conditions with parentheses
      // This generates: WHERE lang = X AND (name LIKE Y OR tags LIKE Y OR tr_name LIKE Y)
      this.queryBuilder.whereGroup([
        ['categories.name', 'ILIKE', `%${search}%`, 'where'],
        ['categories.tags', 'ILIKE', `%${search}%`, 'orWhere'],
        ['category_translations.name', 'ILIKE', `%${search}%`, 'orWhere'],
      ]);
    }
    if (filters.parent_id) {
      this.queryBuilder.where('parent_id', '=', filters.parent_id);
    }
    if (filters.paginated) {
      const count = await this.queryBuilder.count(false);
      this.queryBuilder.orderBy('id', 'DESC');
      const perPage = filters.per_page || 15;
      this.queryBuilder.limit(perPage);
      const page = !filters?.page || filters.page <= 0 ? 1 : filters.page;
      if (filters.page && filters.page > 1) {
        const offset = (filters.page - 1) * perPage;
        this.queryBuilder.offset(offset);
      }
      const last_page = Math.ceil(count / perPage);
      this.requestService.pagination = {
        total_count: count,
        per_page: perPage,
        current_page: page,
        prev_page: page > 1 ? page - 1 : undefined,
        next_page: page < last_page ? page + 1 : undefined,
        last_page,
      };
    }
    if(filters.random){
      this.queryBuilder.random()
    }
  }
}
