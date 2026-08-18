import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { MAX_HIGHLIGHT_SERVICES } from "@repo/common-lib/constants/highlights";
import type { HighlightCount } from "@repo/common-lib/types/general";
import { Helpers } from "src/common/services/helpers.service";
import { CreateServiceRequest } from "./requests/create-service.request";
import { UpdateServiceRequest } from "./requests/update-service.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { ServiceRepository } from "./service.repository";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { AI_QUEUE, CACHE_KEY_SERVICE_SEO, USER_METRICS_QUEUE } from "@repo/common-lib/constants/constants";
import { QueueHelper, SINGLE_ENTITY_METADATA_DEBOUNCE_MS } from "@repo/backend-lib/utils";
import { AiService } from "../ai/ai.service";
import { MediaModerationException } from "src/common/exceptions/media-moderation-exception";
import { ApiException } from "src/common/exceptions/api-exception";
import { serviceCacheKeys } from "../user-services/user-service.service";
import { cleanObj } from "@repo/common-lib/utils/object";
import { insertWithUniqueSlug, resolveEntitySlug } from "src/common/utils/slug.util";
import { versionedAssetPath } from "src/common/utils/asset-path.util";

const CACHE_TTL = 1000 * 60 * 60 * 24;

@Injectable()
export class ServiceService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'service',
  });

  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly helpers: Helpers,
    private readonly aiService: AiService,
    @InjectQueue(AI_QUEUE) private readonly aiQueue: Queue,
    @InjectQueue(USER_METRICS_QUEUE) private readonly metricsQueue: Queue,
  ) { }

  /**
   * Derives the service's permanent slug from its title, resolving collisions within
   * this user's services only (two artists may share a slug — their URLs differ by username).
   * Must run before any slug-derived storage path is built.
   */
  private async resolveSlug(title: string, userId: number) {
    return resolveEntitySlug({
      title,
      fallbackPrefix: 'service',
      exists: (candidate) => this.serviceRepository.slugExists(candidate, userId),
    });
  }

  private async assertTitleIsFree(title: string, userId: number, excludeId?: number) {
    if (await this.serviceRepository.titleExists(title, userId, excludeId)) {
      throw ApiException.titleAlreadyExists(
        'You already have a service with this title. Please choose a different one.',
      );
    }
  }

  async countHighlights(): Promise<HighlightCount> {
    const userId = this.requestService.user.id;
    return this.helpers.cacheRemember(
      serviceCacheKeys.highlightCount(userId),
      this.resolveHighlightCount(userId),
      { append_language: false, ttl: CACHE_TTL },
    );
  }

  private async resolveHighlightCount(userId: number): Promise<HighlightCount> {
    const count = await this.serviceRepository.countHighlights(userId);
    return { count };
  }

  private highlightCountCacheKey(userId: number) {
    return serviceCacheKeys.highlightCount(userId);
  }

  private async enforceHighlightLimit(
    userId: number,
    isHighlight: boolean | undefined,
    currentlyHighlighted = false,
  ) {
    if (isHighlight !== true || currentlyHighlighted) {
      return;
    }

    const count = await this.serviceRepository.countHighlights(userId);
    if (count >= MAX_HIGHLIGHT_SERVICES) {
      throw ApiException.maxHighlights(
        `You can highlight up to ${MAX_HIGHLIGHT_SERVICES} services on your profile page`,
      );
    }
  }

  async create(request: CreateServiceRequest) {
    // Title first: it is the likeliest user error and the cheapest check, so it fails
    // before any upload or limit accounting happens.
    await this.assertTitleIsFree(request.title, request.user_id);
    const slug = await this.resolveSlug(request.title, request.user_id);

    await this.enforceHighlightLimit(request.user_id, request.is_highlight);

    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      services_count: 1,
    });

    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      thumbnailPath = versionedAssetPath(
        `users/${this.requestService.user.public_id}/services/${slug}/thumbnail.webp`,
      );
      this.logger.info('Uploading thumbnail', { path: thumbnailPath });

      await this.helpers.setAsset({
        asset: request.thumbnail,
        path: thumbnailPath,
        targetSizeMb: 0.5,
        targetQuality: 85,
      });

      const thumbnailUrl = await this.helpers.getAsset(thumbnailPath);
      const { moderation } = await this.aiService.moderateContent(thumbnailUrl, {
        user_id: request.user_id,
      });

      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(thumbnailPath);
        throw new MediaModerationException(moderation.reason);
      }
    }

    cleanObj(request)
    const { thumbnail, ...rest } = request;

    const service = await insertWithUniqueSlug(
      slug,
      () => this.resolveSlug(request.title, request.user_id),
      (resolvedSlug) =>
        this.serviceRepository.create({
          ...rest,
          slug: resolvedSlug,
          is_active: rest.is_active ?? true,
          show_price: rest.show_price ?? false,
          is_highlight: rest.is_highlight ?? false,
          thumbnail: thumbnailPath,
        }),
    );

    await this.helpers.deleteManyCached([
      serviceCacheKeys.allByUser(request.user_id),
      this.highlightCountCacheKey(request.user_id),
    ]);

    await QueueHelper.createComputeUserMetricsJob(this.metricsQueue, request.user_id);
    await QueueHelper.createGenerateSingleEntityMetadataJob(
      this.aiQueue,
      {
        entity: 'service',
        id: service.id,
        user_id: service.user_id,
      },
      { delay: SINGLE_ENTITY_METADATA_DEBOUNCE_MS },
    );

    return service;
  }

  async update(id: number, request: UpdateServiceRequest) {
    const service = await this.serviceRepository.getOneCompact(id);

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    if (service.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    await this.enforceHighlightLimit(
      service.user_id,
      request.is_highlight,
      service.is_highlight,
    );

    // The slug is frozen at creation and never re-derived here, so only the title needs checking.
    // `id` is excluded so re-saving an unchanged title is not rejected as a self-collision.
    if (request.title) {
      await this.assertTitleIsFree(request.title, service.user_id, id);
    }

    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      // Versioned per upload so the CDN URL changes; the old object is deleted just below.
      thumbnailPath = versionedAssetPath(
        `users/${this.requestService.user.public_id}/services/${service.slug}/thumbnail.webp`,
      );
      this.logger.info('Uploading thumbnail', { path: thumbnailPath });

      if (service.thumbnail) {
        await this.helpers.deleteAsset(service.thumbnail);
      }

      await this.helpers.setAsset({
        asset: request.thumbnail,
        path: thumbnailPath,
        targetSizeMb: 0.5,
        targetQuality: 85,
      });

      const thumbnailUrl = await this.helpers.getAsset(thumbnailPath);
      const { moderation } = await this.aiService.moderateContent(thumbnailUrl, {
        user_id: service.user_id,
      });

      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(thumbnailPath);
        throw new MediaModerationException(moderation.reason);
      }
    }

    cleanObj(request);
    const { thumbnail, ...rest } = request;
    const updated = await this.serviceRepository.updateById(id, {
      ...rest,
      ...(thumbnailPath ? { thumbnail: thumbnailPath } : {}),
    });

    // The slug is immutable, so there is only ever one slug-keyed entry to invalidate.
    await this.helpers.deleteManyCached([
      serviceCacheKeys.bySlug(service.user_id, service.slug),
      serviceCacheKeys.allByUser(service.user_id),
      this.highlightCountCacheKey(service.user_id),
    ]);

    // Content changed → drop cached SEO metadata (all locales).
    await this.helpers.deleteCached(
      CACHE_KEY_SERVICE_SEO(service.user_id, service.slug),
      { appended_language: true },
    );

    return updated;
  }
}
