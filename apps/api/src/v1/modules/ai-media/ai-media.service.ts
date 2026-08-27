import { Injectable } from '@nestjs/common';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { AiService } from '@repo/backend-lib/services/ai-service';
import { MediaService } from '../media/media.service';
import { CategoriesService } from '../categories/categories.service';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { CollectionRepository } from '../collections/collection.repository';

@Injectable()
export class AiMediaService {
  private readonly logger = FactoryLogService.createLogService('file', { channel: 'ai' });

  constructor(
    private readonly aiService: AiService,
    private readonly mediaService: MediaService,
    private readonly categoriesService: CategoriesService,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly collectionRepository: CollectionRepository,
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

    await this.markParentSeoStale(request.media_id);

    return media;
  }

  /**
   * Portfolio/collection SEO is written from the text of the media they display, so an image that
   * only now received its own metadata leaves its parents describing content they can no longer see.
   * Nothing else marks them stale — the pivot changes, not their `updated_at`.
   *
   * Only the stamp is moved, so the nightly `AiTask` sweep regenerates them ONCE — and no sooner
   * than `SEO_REGENERATION_MIN_INTERVAL_DAYS` after their last rewrite. Generating here instead would
   * fire a call per image: an artist running AI across a gallery would pay for the same portfolio a
   * dozen times over and could exhaust their credits on intermediate results.
   *
   * Best-effort — a failure here must not fail the media generation the user paid for.
   */
  private async markParentSeoStale(mediaId: number): Promise<void> {
    try {
      await Promise.all([
        this.portfolioRepository.markSeoStaleByMediaId(mediaId),
        this.collectionRepository.markSeoStaleByMediaId(mediaId),
      ]);
    } catch (error) {
      this.logger
        .name('mark-parent-seo-stale')
        .error(
          `Failed to mark parent SEO stale for media [${mediaId}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
    }
  }
}
