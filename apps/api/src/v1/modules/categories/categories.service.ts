import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IndexCategoriesRequest } from './requests/index-categories.request';
import { CategoriesRepository } from './categories.repository';
import { Helpers } from 'src/common/services/helpers.service';
import {
  CACHE_KEY_ACTIVE_CATEGORIES,
  CACHE_KEY_USER_CATEGORIES,
} from '@repo/common-lib/constants/cache';
import { CreateCategoryRequest } from './requests/create-category.request';
import { UpdateCategoryRequest } from './requests/update-category.request';
import { RequestService } from 'src/common/services/request.service';
import {
  generateValidSlug,
  isAValidSlugFormat,
} from '@repo/common-lib/utils/generate-valid-slug';
import {
  allocateUniqueSlug,
  SlugAllocationError,
} from '@repo/common-lib/utils/unique-slug';
import { cleanObj } from '@repo/common-lib/utils/object';
import {
  CategoryBase,
  CreateCategoryInput,
  CreateCategoryTranslationRow,
  UpdateCategoryInput,
} from '@repo/common-lib/types/category';
import { EnumType } from '@repo/common-lib/constants/enums';
import { CategoryTranslationsService } from './category-translations.service';
import { versionedAssetPath } from 'src/common/utils/asset-path.util';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoryRepository: CategoriesRepository,
    private readonly categoryTranslationsService: CategoryTranslationsService,
    private readonly helpers: Helpers,
    private readonly requestService: RequestService,
  ) { }

  async findAll(indexCategoriesRequest: IndexCategoriesRequest) {
    let result = await this.categoryRepository.findAll(indexCategoriesRequest);

    if (indexCategoriesRequest.with_thumbnail) {

      result = await Promise.all(result.map(async (c) => {

        if (!c.thumbnail) return c;

        const thumbnail = await this.helpers.getAsset(c.thumbnail);
        return {
          ...c,
          thumbnail
        }
      }))
    }
    return result;
  }

  /**
   * All active categories as {@link CategoryBase} without `thumbnail`. Canonical English names
   * (ids/names stay language-independent). Cached for 1 day.
   */
  async findAllActive(): Promise<Omit<CategoryBase, 'thumbnail'>[]> {
    return this.helpers.cacheRemember(
      CACHE_KEY_ACTIVE_CATEGORIES,
      this.categoryRepository.findAllActive(),
      { ttl: 1000 * 60 * 60 * 24 },
    );
  }

  async findAllUserCategories(userId: number) {
    return this.helpers.cacheRemember(
      CACHE_KEY_USER_CATEGORIES(userId),
      this.categoryRepository.findAll({
        paginated: false,
        user_id: userId,
      }),
      {
        append_language: true,
        ttl: 1000 * 60 * 60 * 24,
      },
    );
  }

  async create(request: CreateCategoryRequest): Promise<CategoryBase> {
    const baseSlug = generateValidSlug(request.name);
    if (!isAValidSlugFormat(baseSlug)) {
      throw new BadRequestException(
        'Category name must produce a valid slug (at least 3 characters, lowercase letters, numbers, and hyphens only).',
      );
    }
    const slug = await this.ensureUniqueSlug(baseSlug);

    let thumbnailPath: string | null = null;
    if (request.thumbnail) {
      thumbnailPath = await this.storeCategoryThumbnail(
        slug,
        request.thumbnail,
      );
    }

    const tagsStr =
      request.tags?.length ? request.tags.join(',') : '';

    const translationRows = this.resolveTranslationRowsForCreate(request);
    this.assertUniqueTranslationLanguages(translationRows);

    const input: CreateCategoryInput = {
      name: request.name,
      slug,
      tags: tagsStr,
      thumbnail: thumbnailPath,
      is_featured: request.is_featured ?? false,
      is_active: request.is_active ?? true,
      type: request.type ?? 'DISCIPLINE',
      parent_id: request.parent_id ?? null,
      translations: translationRows,
    };

    const { translations, ...categoryOnly } = input;
    const category = await this.categoryRepository.create(categoryOnly);

    await this.upsertCategoryTranslations(category.id, translations);

    return this.loadCategoryBaseResponse(category.id);
  }

  async update(
    id: number,
    request: UpdateCategoryRequest,
  ): Promise<CategoryBase> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    /** undefined = leave DB thumbnail unchanged */
    let nextThumbnail: string | null | undefined = undefined;

    if (request.thumbnail) {
      nextThumbnail = await this.storeCategoryThumbnail(
        existing.slug,
        request.thumbnail,
        existing.thumbnail,
      );
    }

    const patch: UpdateCategoryInput = {};
    if (request.name !== undefined) patch.name = request.name;
    if (request.tags !== undefined) {
      patch.tags = request.tags.length ? request.tags.join(',') : '';
    }
    if (request.parent_id !== undefined) {
      patch.parent_id = request.parent_id;
    }
    if (request.is_featured !== undefined) {
      patch.is_featured = request.is_featured;
    }
    if (request.is_active !== undefined) {
      patch.is_active = request.is_active;
    }
    if (request.type !== undefined) {
      patch.type = request.type;
    }
    if (nextThumbnail !== undefined) {
      patch.thumbnail = nextThumbnail;
    }
    cleanObj(patch);

    const hasTranslationUpdates =
      request.translations != null && request.translations.length > 0;

    if (
      !Object.keys(patch).length &&
      !request.thumbnail &&
      !hasTranslationUpdates
    ) {
      return this.loadCategoryBaseResponse(id);
    }

    if (Object.keys(patch).length > 0) {
      await this.categoryRepository.updateById(id, patch);
    }

    if (hasTranslationUpdates) {
      const rows = this.normalizeTranslationItems(request.translations!);
      this.assertUniqueTranslationLanguages(rows);
      await this.upsertCategoryTranslations(id, rows);
    }

    return this.loadCategoryBaseResponse(id);
  }

  private async loadCategoryBaseResponse(id: number): Promise<CategoryBase> {
    const base = await this.categoryRepository.findByIdAsBase(id);
    if (!base) {
      throw new NotFoundException('Category not found');
    }
    return this.withThumbnailUrl(base);
  }

  private resolveTranslationRowsForCreate(
    request: CreateCategoryRequest,
  ): CreateCategoryTranslationRow[] {
    if (request.translations?.length) {
      return this.normalizeTranslationItems(request.translations);
    }
    return [
      {
        name: request.name.trim(),
        language_code: this.requestService.language,
      },
    ];
  }

  private normalizeTranslationItems(
    items: ReadonlyArray<{ name: string; language_code: string }>,
  ): CreateCategoryTranslationRow[] {
    return items.map((t) => ({
      name: t.name.trim(),
      language_code: t.language_code as EnumType<'LANGUAGE_CODE'>,
    }));
  }

  private assertUniqueTranslationLanguages(
    rows: CreateCategoryTranslationRow[],
  ): void {
    const seen = new Set<string>();
    for (const t of rows) {
      if (seen.has(t.language_code)) {
        throw new BadRequestException(
          `Duplicate translation for language_code: ${t.language_code}`,
        );
      }
      seen.add(t.language_code);
    }
  }

  private async upsertCategoryTranslations(
    categoryId: number,
    rows: CreateCategoryTranslationRow[],
  ): Promise<void> {
    for (const row of rows) {
      await this.categoryTranslationsService.updateOrCreate({
        category_id: categoryId,
        name: row.name,
        code: row.language_code,
      });
    }
  }

  private async storeCategoryThumbnail(
    slug: string,
    file: Express.Multer.File,
    replaceExistingPath?: string | null,
  ): Promise<string> {
    if (replaceExistingPath) {
      await this.helpers.deleteAsset(replaceExistingPath);
    }
    return this.helpers.setAsset({
      asset: file,
      path: this.categoryThumbnailKey(slug),
      targetSizeMb: 100 / 1024,
      targetQuality: 80,
    });
  }

  /**
   * Versioned per upload: the CDN serves a stable unsigned URL per key, so replacing a thumbnail
   * at a fixed key left CloudFront and browsers serving the old image. `storeCategoryThumbnail`
   * deletes the superseded object.
   */
  private categoryThumbnailKey(slug: string): string {
    return versionedAssetPath(`categories/${slug}/thumbnail.webp`);
  }

  /**
   * Categories are globally scoped (no owning user), so the predicate takes only `excludeId`.
   * Contrast with portfolios/services/collections, whose predicates must filter on `user_id`.
   */
  private async ensureUniqueSlug(
    base: string,
    excludeId?: number,
  ): Promise<string> {
    try {
      return await allocateUniqueSlug(base, (candidate) =>
        this.categoryRepository.slugExists(candidate, excludeId),
      );
    } catch (error) {
      if (error instanceof SlugAllocationError) {
        throw new BadRequestException('Could not allocate a unique slug.');
      }
      throw error;
    }
  }

  private async withThumbnailUrl(base: CategoryBase): Promise<CategoryBase> {
    if (!base.thumbnail) return base;
    return {
      ...base,
      thumbnail: await this.helpers.getAsset(base.thumbnail),
    };
  }
}
