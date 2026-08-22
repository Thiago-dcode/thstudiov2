import { Injectable } from '@nestjs/common';
import { CACHE_KEY_CATEGORY_TRANSLATION } from '@repo/common-lib/constants/cache';
import {
  CategoryTranslation,
  CategoryTranslationCreatePayload,
} from '@repo/common-lib/types/category';
import { Helpers } from 'src/common/services/helpers.service';
import { CategoryTranslationsRepository } from './category-translations.repository';

/** Full insert shape for upsert (same as {@link CategoryTranslationCreatePayload}). */
export type UpsertCategoryTranslationPayload = CategoryTranslationCreatePayload;

const CATEGORY_TRANSLATION_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

@Injectable()
export class CategoryTranslationsService {
  constructor(
    private readonly categoryTranslationsRepository: CategoryTranslationsRepository,
    private readonly helpers: Helpers,
  ) {}

  async updateOrCreate(
    payload: CategoryTranslationCreatePayload,
  ): Promise<CategoryTranslation> {
    const { category_id, code, ...updatePayload } = payload;
    const exists =
      await this.categoryTranslationsRepository.existsByCategoryAndLanguage(
        category_id,
        code,
      );

    let result: CategoryTranslation;

    if (exists) {
      const updated =
        await this.categoryTranslationsRepository.updateByCategoryAndLanguage(
          category_id,
          code,
          updatePayload,
        );
      if (!updated) {
        throw new Error(
          `Category translation update failed for category ${category_id}, language ${code}`,
        );
      }
      result = updated;
    } else {
      result = await this.categoryTranslationsRepository.create(payload);
    }

    await this.helpers.deleteCached(
      CACHE_KEY_CATEGORY_TRANSLATION(category_id, code),
      {},
    );
    return result;
  }

  async findByCategoryAndLanguageCached(
    categoryId: number,
    languageCode: string,
  ): Promise<CategoryTranslation | undefined> {
    const key = CACHE_KEY_CATEGORY_TRANSLATION(categoryId, languageCode);
    const stored = await this.helpers.cacheRemember<
      CategoryTranslation | null
    >(
      key,
      this.categoryTranslationsRepository
        .findByCategoryAndLanguage(categoryId, languageCode)
        .then((t) => t ?? null),
      {
        append_language: false,
        ttl: CATEGORY_TRANSLATION_CACHE_TTL_MS,
      },
    );
    return stored ?? undefined;
  }
}
