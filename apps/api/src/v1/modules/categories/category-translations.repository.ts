import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { TABLES_ENUM } from '@repo/common-lib/constants/enums';
import {
  CategoryTranslation,
  CategoryTranslationCreatePayload,
  CategoryTranslationUpdatePayload,
} from '@repo/common-lib/types/category';

@Injectable()
export class CategoryTranslationsRepository extends BaseRepository {
  constructor() {
    super(TABLES_ENUM.CATEGORY_TRANSLATIONS);
  }

  async findByCategoryAndLanguage(
    categoryId: number,
    languageCode: string,
  ): Promise<CategoryTranslation | undefined> {
    const row = await this.query()
      .where('category_id', '=', categoryId)
      .where('language_code', '=', languageCode)
      .first<{ id: number; name: string; language_code: string }>();
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      code: row.language_code,
    };
  }

  async existsByCategoryAndLanguage(
    categoryId: number,
    languageCode: string,
  ): Promise<boolean> {
    return this.exists({
      category_id: categoryId,
      language_code: languageCode,
    });
  }

  async create(
    payload: CategoryTranslationCreatePayload,
  ): Promise<CategoryTranslation> {
    const { category_id, name, code } = payload;
    const trRow = await this.query().insertAndGet<{ id: number }>(
      ['name', 'language_code', 'category_id'],
      [name, code, category_id],
      ['id'],
    );
    return {
      id: trRow.id,
      name,
      code,
    };
  }

  async updateByCategoryAndLanguage(
    categoryId: number,
    languageCode: string,
    payload: CategoryTranslationUpdatePayload,
  ): Promise<CategoryTranslation | undefined> {
    const cols = Object.keys(payload) as (keyof CategoryTranslationUpdatePayload)[];
    const values = cols.map((c) => payload[c]!);
    if (cols.length) {
      await this.query()
        .where('category_id', '=', categoryId)
        .where('language_code', '=', languageCode)
        .update(cols as string[], values);
    }
    return this.findByCategoryAndLanguage(categoryId, languageCode);
  }
}
