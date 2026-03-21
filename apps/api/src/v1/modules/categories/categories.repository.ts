import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { RequestService } from 'src/common/services/request.service';
import {
  CategoryWithTranslationSchemaColumns,
  CategoryWithTranslationsSchema,
} from '@repo/common-lib/schemas/category';
import {
  CategoryBase,
  CategoryIndexRequest,
} from '@repo/common-lib/types/category';
import { QueryBuilder } from '@repo/database/queryBuilder';

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
  async findAll(filters: CategoryIndexRequest) {
    const query = await this.applyFilters(
      filters,
      this.query().select(this.BASE_COLUMNS),
    );
    return this.formatCategories(
      await query.get<CategoryWithTranslationsSchema[]>(),
    );
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
  async applyFilters(
    filters: CategoryIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    query.join('id', 'category_translations', 'category_id', 'LEFT');

    // Always filter by language first
    query.where(
      'category_translations.language_code',
      '=',
      this.requestService.language,
    );

    if (filters.user_id) {
      query
        .join('id', 'user_categories', 'category_id', 'LEFT')
        .where('user_categories.user_id', '=', filters.user_id);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      // Use whereGroup to properly group OR conditions with parentheses
      // This generates: WHERE lang = X AND (name LIKE Y OR tags LIKE Y OR tr_name LIKE Y)
      query.whereGroup([
        ['categories.name', 'ILIKE', `%${search}%`, 'where'],
        ['categories.tags', 'ILIKE', `%${search}%`, 'orWhere'],
        ['category_translations.name', 'ILIKE', `%${search}%`, 'orWhere'],
      ]);
    }
    if (filters.parent_id) {
      query.where('parent_id', '=', filters.parent_id);
    }
    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);

    if (filters.random) {
      query.random();
    }
    return query;
  }
}
