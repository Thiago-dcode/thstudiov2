import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { MediaService } from '../media/media.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class AiMediaService {
  constructor(
    private readonly aiService: AiService,
    private readonly mediaService: MediaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Generate SEO for a media image in ALL app languages (EN/ES/PT) + category tags in ONE call, then
   * persist: main-row EN fallback + language-neutral filename, the category pivot, and the per-locale
   * media_translations rows.
   */
  public async generateMediaMetadata(request: { media_id: number; user_id: number }) {
    const [imageUrl, categories] = await Promise.all([
      this.mediaService.getAsset(request.media_id),
      this.categoriesService.findAllActive(),
    ]);

    const metadata = await this.aiService.generateMediaMetadata(imageUrl, categories, {
      media_id: request.media_id,
      user_id: request.user_id,
    });

    // EN row (fallback to first) → the main-row SEO columns; filename is shared across locales.
    const en =
      metadata.translations.find((t) => t.language_code === 'EN') ?? metadata.translations[0];

    const media = await this.mediaService.update(request.media_id, {
      seo_title: en?.seo_title ?? null,
      seo_description: en?.seo_description ?? null,
      seo_alt: en?.seo_alt ?? null,
      seo_generated_at: new Date(),
      // Only overwrite the filename when the model actually returned one (it shapes the asset path).
      ...(metadata.seo_filename ? { seo_filename: metadata.seo_filename } : {}),
    });

    await Promise.all([
      this.mediaService.attachCategories(request.media_id, metadata.category_ids),
      this.mediaService.upsertSeoTranslations(request.media_id, metadata.translations),
    ]);

    // Drop the cached SEO now that fresh per-locale translations are persisted.
    await this.mediaService.invalidateSeoCache(media.public_id);

    return media;
  }
}
