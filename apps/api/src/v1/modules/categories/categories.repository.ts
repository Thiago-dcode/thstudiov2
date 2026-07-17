import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { RequestService } from 'src/common/services/request.service';
import {
  CategorySchema,
  CategoryWithTranslationSchemaColumns,
  CategoryWithTranslationsSchema,
} from '@repo/common-lib/schemas/category';
import {
  CategoryBase,
  CategoryIndexRequest,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@repo/common-lib/types/category';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import { QueryBuilder } from '@repo/database/queryBuilder';

@Injectable()
export class CategoriesRepository extends BaseRepository {
  constructor(private readonly requestService: RequestService, protected readonly logService: LogService) {
    super('categories', logService);
  }
  private readonly BASE_COLUMNS: CategoryWithTranslationSchemaColumns[] = [
    'categories.id',
    'categories.name',
    'categories.slug',
    'categories.parent_id',
    'categories.is_featured',
    'categories.is_active',
    'categories.tags',
    'categories.thumbnail',
    'category_translations.name as tr_name',
  ];

  private readonly ROW_SELECT: (keyof CategorySchema)[] = [
    'id',
    'name',
    'slug',
    'tags',
    'thumbnail',
    'is_featured',
    'is_active',
    'parent_id',
    'created_at',
    'updated_at',
  ];

  async findAll(filters: CategoryIndexRequest) {
    const query = await this.applyFilters(
      filters,
      this.query().select(this.BASE_COLUMNS)
    );
    return this.formatCategories(
      await query.get<CategoryWithTranslationsSchema[]>(),
    );
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    let q = this.query().where('slug', '=', slug);
    if (excludeId != null) {
      q = q.where('id', '!=', excludeId);
    }
    return q.exists();
  }

  async findById(id: number): Promise<CategorySchema | null> {
    return await this.query()
      .select(this.ROW_SELECT)
      .where('id', '=', id)
      .first<CategorySchema>();
  }

  /** Same translation join + resolved `name` as {@link findAll}. */
  async findByIdAsBase(id: number): Promise<CategoryBase | null> {
    const row = await this.joinCategoryTranslationForRequestLanguage(
      this.query().select(this.BASE_COLUMNS),
    )
      .where('id', '=', id)
      .first<CategoryWithTranslationsSchema>();
    if (!row) return null;
    return this.formatOneCategoryRow(row);
  }

  async create(
    input: Omit<CreateCategoryInput, 'translations'>,
  ): Promise<CategorySchema> {
    const { name, slug, tags, thumbnail, is_featured, is_active, parent_id } = input;

    const cols = ['name', 'slug', 'tags', 'thumbnail', 'is_featured', 'is_active', 'parent_id'];
    const values = [
      name,
      slug,
      tags,
      thumbnail,
      is_featured,
      is_active,
      parent_id,
    ] as const;

    return this.query().insertAndGet<CategorySchema>(
      [...cols],
      [...values],
      this.ROW_SELECT,
    );
  }

  async updateById(
    id: number,
    input: UpdateCategoryInput,
  ): Promise<CategorySchema> {
    const cols = Object.keys(input) as (keyof typeof input)[];
    const values = cols.map((c) => input[c]!);
    if (cols.length) {
      await this.query().where('id', '=', id).update(cols as string[], values);
    }

    const category = await this.findById(id);
    if (!category) {
      throw new Error(`Category ${id} not found after update`);
    }

    return category;
  }

  private formatOneCategoryRow(
    row: CategoryWithTranslationsSchema,
  ): CategoryBase {
    const {
      id,
      name,
      slug,
      tags,
      parent_id,
      thumbnail,
      is_featured,
      is_active,
      tr_name,
    } = row;
    const displayName =
      tr_name != null && String(tr_name).trim() !== '' ? tr_name : name;
    return {
      id,
      tags: tags ? tags.split(',') : [],
      name: displayName,
      slug,
      parent_id,
      thumbnail,
      is_featured,
      is_active,
    };
  }

  private formatCategories(
    result: CategoryWithTranslationsSchema[],
  ): CategoryBase[] {
    const categories: {
      [id: number]: CategoryBase;
    } = {};
    for (let i = 0; i < result.length; i++) {
      const row = result[i];
      categories[row.id] = this.formatOneCategoryRow(row);
    }

    return Object.values(categories);
  }

  private joinCategoryTranslationForRequestLanguage(
    query: QueryBuilder,
  ): QueryBuilder {
    const lang = this.requestService.language;
    return query.join(
      'id',
      TABLES_ENUM.CATEGORY_TRANSLATIONS,
      'category_id',
      'LEFT',
      `AND category_translations.language_code = '${lang}'`,
    );
  }

  async applyFilters(
    filters: CategoryIndexRequest,
    query: QueryBuilder,
  ): Promise<QueryBuilder> {
    this.joinCategoryTranslationForRequestLanguage(query);

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

    if (filters.categories?.length) {
      query.whereIn('categories.id', filters.categories);
    }

    if (filters.slugs?.length) {
      query.whereIn('categories.slug', filters.slugs);
    }

    if (typeof filters.is_featured === 'boolean') {
      query.where('categories.is_featured', '=', filters.is_featured);
    }

    if (typeof filters.is_active === 'boolean') {
      query.where('categories.is_active', '=', filters.is_active);
    } else if (
      !filters.user_id &&
      !filters.slugs?.length &&
      !filters.categories?.length
    ) {
      query.where('categories.is_active', '=', true);
    }

    this.requestService.pagination =
      await this.handleOffsetPagination(query, filters);

    if (filters.random) {
      query.random();
    }
    return query;
  }
}
