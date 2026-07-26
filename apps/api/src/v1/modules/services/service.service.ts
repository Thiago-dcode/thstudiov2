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
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CACHE_KEY_SERVICE_SEO, GENERATE_SINGLE_ENTITY_METADATA_EVENT, UPDATE_USER_EXTRA_DATA_METRICS } from "@repo/common-lib/constants/constants";
import { UpdateUserExtraDataMetricsEvent } from "../user-extra-data/events/update-user-extra-data-metrics.event";
import { GenerateSingleEntityMetadataEvent } from "../ai/events/generate-single-entity-metadata.event";
import { AiService } from "../ai/ai.service";
import { MediaModerationException } from "src/common/exceptions/media-moderation-exception";
import { ApiException } from "src/common/exceptions/api-exception";
import { serviceCacheKeys } from "../user-services/user-service.service";
import { cleanObj } from "@repo/common-lib/utils/object";

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
    private readonly eventEmitter: EventEmitter2,
    private readonly helpers: Helpers,
    private readonly aiService: AiService,
  ) { }

  private async slugExists(slug: string, userId: number) {
    return {
      exists: await this.serviceRepository.slugExists(slug, userId),
    };
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
    if ((await this.slugExists(request.slug, request.user_id)).exists) {
      throw new BadRequestException(`Slug ${request.slug} already exists`);
    }

    await this.enforceHighlightLimit(request.user_id, request.is_highlight);

    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      services_count: 1,
    });

    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      thumbnailPath = `users/${this.requestService.user.public_id}/services/${request.slug}/thumbnail.webp`;
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

    const service = await this.serviceRepository.create({
      ...rest,
      is_active: rest.is_active ?? true,
      show_price: rest.show_price ?? false,
      is_highlight: rest.is_highlight ?? false,
      thumbnail: thumbnailPath,
    });

    await this.helpers.deleteManyCached([
      serviceCacheKeys.allByUser(request.user_id),
      this.highlightCountCacheKey(request.user_id),
    ]);

    this.eventEmitter.emit(
      UPDATE_USER_EXTRA_DATA_METRICS,
      new UpdateUserExtraDataMetricsEvent(request.user_id),
    );
    this.eventEmitter.emit(
      GENERATE_SINGLE_ENTITY_METADATA_EVENT,
      new GenerateSingleEntityMetadataEvent({
        entity: 'service',
        id: service.id,
        user_id: service.user_id,
      }),
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

    if (request.slug && request.slug !== service.slug) {
      if ((await this.slugExists(request.slug, service.user_id)).exists) {
        throw new BadRequestException(`Slug ${request.slug} already exists`);
      }
    }

    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      const slug = request.slug ?? service.slug;
      thumbnailPath = `users/${this.requestService.user.public_id}/services/${slug}/thumbnail.webp`;
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

    const keysToInvalidate = [
      serviceCacheKeys.bySlug(service.user_id, service.slug),
      serviceCacheKeys.allByUser(service.user_id),
      this.highlightCountCacheKey(service.user_id),
    ];
    if (request.slug && request.slug !== service.slug) {
      keysToInvalidate.push(serviceCacheKeys.bySlug(service.user_id, request.slug));
    }
    await this.helpers.deleteManyCached(keysToInvalidate);

    // Content changed → drop cached SEO metadata (old + new slug, all locales).
    for (const s of new Set(
      [service.slug, request.slug].filter(Boolean) as string[],
    )) {
      await this.helpers.deleteCached(CACHE_KEY_SERVICE_SEO(service.user_id, s), {
        appended_language: true,
      });
    }

    return updated;
  }
}
