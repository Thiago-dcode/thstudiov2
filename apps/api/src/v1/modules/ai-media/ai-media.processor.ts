import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from '@repo/backend-lib/services/ai-service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import {
  AI_MEDIA_QUEUE,
  JOB_GENERATE_MEDIA_METADATA,
  JOB_GENERATE_MEDIA_METADATA_AND_NOTIFY,
} from '@repo/common-lib/constants/queues';
import { GenerateMediaMetadataInput } from '@repo/common-lib/types/ai';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { CategoriesService } from '../categories/categories.service';
import { CollectionRepository } from '../collections/collection.repository';
import { MediaRepository } from '../media/media.repository';
import { MediaService } from '../media/media.service';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { AiMediaService } from './ai-media.service';

@Processor(AI_MEDIA_QUEUE)
export class AiMediaProcessor extends GlobalProcessor {
  constructor(
    private readonly aiService: AiService,
    private readonly aiMediaService: AiMediaService,
    private readonly mediaService: MediaService,
    private readonly mediaRepository: MediaRepository,
    private readonly categoriesService: CategoriesService,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly logger: LogService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_GENERATE_MEDIA_METADATA:
          return await this.generateMediaMetadata(job.data);
        case JOB_GENERATE_MEDIA_METADATA_AND_NOTIFY:
          return await this.generateMediaMetadataAndNotify(job.data);
        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.logger.flushAsync();
    }
  }

  private async generateMediaMetadataAndNotify(request: GenerateMediaMetadataInput) {
    return this.aiMediaService.generateMediaMetadataAndNotify(request);
  }

  /**
   * Generate SEO for a media image in ALL app languages (EN/ES/PT) + category tags in ONE call, then
   * persist: main-row EN fallback + language-neutral filename, the category pivot, and the per-locale
   * media_translations rows.
   */
  private async generateMediaMetadata(request: GenerateMediaMetadataInput) {
    const log = this.logger.name('generate-media-metadata');

    try {
      const [{ url }, categories] = await Promise.all([
        this.mediaService.getAsset(request.media_id),
        this.categoriesService.findAllActive(),
      ]);

      const metadata = await this.aiService.generateMediaMetadata(url, categories, {
        media_id: request.media_id,
        user_id: request.user_id,
      });

      // EN row (fallback to first) → the main-row SEO columns; filename is shared across locales.
      const en =
        metadata.translations.find((t) => t.language_code === 'EN') ?? metadata.translations[0];

      const media = await this.mediaService.updateForUser(request.media_id, request.user_id, {
        seo_title: en?.seo_title ?? null,
        seo_description: en?.seo_description ?? null,
        seo_alt: en?.seo_alt ?? null,
        seo_generated_at: new Date(),
        // Only overwrite the filename when the model actually returned one (it shapes the asset path).
        ...(metadata.seo_filename ? { seo_filename: metadata.seo_filename } : {}),
      });

      await Promise.all([
        this.mediaService.attachCategoriesForUser(
          request.media_id,
          request.user_id,
          metadata.category_ids,
        ),
        this.mediaService.upsertSeoTranslations(request.media_id, metadata.translations),
        this.mediaService.invalidateSeoCache(media.public_id),
        this.markParentSeoStale(request.media_id),
        this.mediaRepository.updateById(request.media_id, { status: 'COMPLETED' })

      ]);

      await QueueHelper.createOrUpdateUserNotificationJob({
        type: 'GENERATE_MEDIA_METADATA',
        user_id: request.user_id,
        entity_id: request.media_id,
        read_at: null,
      });

      return media;
    } catch (error) {
      await this.mediaRepository.updateById(request.media_id, { status: 'COMPLETED' });

      await QueueHelper.createOrUpdateUserNotificationJob({
        type: 'FAILED_GENERATE_MEDIA_METADATA',
        user_id: request.user_id,
        entity_id: request.media_id,
        read_at: null,
      });

      log.error(
        `Failed to generate metadata for media [${request.media_id}] (user ${request.user_id}) - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
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
