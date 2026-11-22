import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { MAX_HIGHLIGHT_SERVICES } from "@repo/common-lib/constants/highlights";
import type { HighlightCount } from "@repo/common-lib/types/general";
import { Helpers } from "src/common/services/helpers.service";
import { CreateServiceRequest } from "./requests/create-service.request";
import { UpdateServiceRequest } from "./requests/update-service.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { ServiceRepository } from "./service.repository";
import { CACHE_KEY_SERVICE_SEO } from "@repo/common-lib/constants/cache";
import { QueueHelper, SINGLE_ENTITY_METADATA_DEBOUNCE_MS } from "@repo/backend-lib/utils";
import { AiService } from "@repo/backend-lib/services/ai-service";
import { MediaModerationException } from "src/common/exceptions/media-moderation-exception";
import { ApiException } from "src/common/exceptions/api-exception";
import { serviceCacheKeys } from "../user-services/user-service.service";
import { cleanObj } from "@repo/common-lib/utils/object";
import { insertWithUniqueSlug, resolveEntitySlug } from "src/common/utils/slug.util";
import { descriptiveFilename, versionedAssetPath } from "src/common/utils/asset-path.util";
import { assertOwnedIds } from "src/common/utils/owned-ids.util";
import { ENTITY_CREATE_LOCK_TTL_MS, withUserLock } from "src/common/utils/user-lock";
import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from "@repo/common-lib/constants/events";
import { ArtistPublicPagesChangedEvent } from "../edge-cache/events/artist-public-pages-changed.event";
import type { ApiLogger } from 'src/common/services/request.service';
import type { SortModulesResult } from '@repo/common-lib/types/sort-module';
import type { ModuleStatus } from '@repo/common-lib/types/module-status';
import { SortModulesRequest } from 'src/common/requests/sort-modules.request';
import { UpdateModuleStatusRequest } from 'src/common/requests/update-module-status.request';
import {
  reorderOwnedModules,
  updateOwnedModuleStatus,
  type SortableModuleLabels,
} from 'src/common/utils/sortable-module.util';

const SERVICE_LABELS: SortableModuleLabels = {
  subject: 'Service',
  plural: 'services',
  idKey: 'service_id',
};

const CACHE_TTL = 1000 * 60 * 60 * 24;

@Injectable()
export class ServiceService {
  private readonly logger: ApiLogger;
  private readonly reorderLog: ApiLogger;
  private readonly statusLog: ApiLogger;

  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly helpers: Helpers,
    private readonly aiService: AiService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger = this.requestService.log('services');
    this.reorderLog = this.requestService.log('services', { operation: 'service-reorder' });
    this.statusLog = this.requestService.log('services', { operation: 'service-status-update' });
  }

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
    // The cap check and the insert must not interleave with another create for the same user.
    return withUserLock(`create:services:${request.user_id}`, ENTITY_CREATE_LOCK_TTL_MS, () =>
      this.createLocked(request),
    );
  }

  private async createLocked(request: CreateServiceRequest) {
    // Title first: it is the likeliest user error and the cheapest check, so it fails
    // before any upload or limit accounting happens.
    await this.assertTitleIsFree(request.title, request.user_id);
    await assertOwnedIds(TABLES_ENUM.PORTFOLIOS, request.portfolio_id ? [request.portfolio_id] : [], request.user_id, 'Portfolio');
    const slug = await this.resolveSlug(request.title, request.user_id);

    await this.enforceHighlightLimit(request.user_id, request.is_highlight);

    await this.userExtraDataService.enforceEntityLimit(request.user_id, 'services');

    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      thumbnailPath = versionedAssetPath(
        `users/${this.requestService.user.public_id}/services/${slug}/${descriptiveFilename([slug], 'cover')}`,
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
      }, this.requestService.traceCarrier());

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

    await QueueHelper.createComputeUserMetricsJob(request.user_id, this.requestService.traceCarrier());
    await QueueHelper.createGenerateSingleEntityMetadataJob(
      {
        entity: 'service',
        id: service.id,
        user_id: service.user_id,
      },
      { delay: SINGLE_ENTITY_METADATA_DEBOUNCE_MS },
      this.requestService.traceCarrier(),
    );
    this.eventEmitter.emit(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      new ArtistPublicPagesChangedEvent(request.user_id),
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
    await assertOwnedIds(TABLES_ENUM.PORTFOLIOS, request.portfolio_id ? [request.portfolio_id] : [], service.user_id, 'Portfolio');

    // The slug is frozen at creation and never re-derived here, so only the title needs checking.
    // `id` is excluded so re-saving an unchanged title is not rejected as a self-collision.
    if (request.title) {
      await this.assertTitleIsFree(request.title, service.user_id, id);
    }

    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      // Versioned per upload so the CDN URL changes; the old object is deleted just below.
      thumbnailPath = versionedAssetPath(
        `users/${this.requestService.user.public_id}/services/${service.slug}/${descriptiveFilename([service.slug], 'cover')}`,
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
      }, this.requestService.traceCarrier());

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
    this.eventEmitter.emit(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      new ArtistPublicPagesChangedEvent(service.user_id),
    );

    return updated;
  }

  /**
   * Saves the order the artist dragged their services into. Unlike portfolios, the visitor list
   * of a user's services is cached in Redis, so a real change also drops that entry.
   */
  async updatePositions(request: SortModulesRequest): Promise<SortModulesResult> {
    return reorderOwnedModules({
      labels: SERVICE_LABELS,
      table: TABLES_ENUM.SERVICES,
      log: this.reorderLog,
      userId: this.requestService.user.id,
      items: request.items,
      write: (userId, items) => this.serviceRepository.updatePositions(userId, items),
      onChanged: async (userId) => {
        await this.helpers.deleteCached(serviceCacheKeys.allByUser(userId));
        this.eventEmitter.emit(
          ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
          new ArtistPublicPagesChangedEvent(userId),
        );
      },
    });
  }

  /**
   * Quick toggle of `is_highlight` / `is_active` from the atelier card. Unlike `update()` it
   * rewrites nothing else (that one replaces features and terms), and mirrors its side effects:
   * list/slug/highlight-count caches, SEO-metadata cache (its noindex depends on `is_active`)
   * and the edge purge.
   */
  async updateStatus(id: number, request: UpdateModuleStatusRequest): Promise<ModuleStatus> {
    const userId = this.requestService.user.id;
    return updateOwnedModuleStatus({
      labels: SERVICE_LABELS,
      log: this.statusLog,
      userId,
      id,
      request,
      getCurrent: (serviceId) => this.serviceRepository.getOneCompact(serviceId),
      enforceHighlightLimit: (ownerId, isHighlight, current) =>
        this.enforceHighlightLimit(ownerId, isHighlight, current),
      write: (serviceId, ownerId, input) =>
        this.serviceRepository.updateStatus(serviceId, ownerId, input),
      onChanged: async (current) => {
        await this.helpers.deleteManyCached([
          serviceCacheKeys.allByUser(userId),
          serviceCacheKeys.bySlug(userId, current.slug),
          ...(request.is_highlight !== undefined ? [this.highlightCountCacheKey(userId)] : []),
        ]);
        if (request.is_active !== undefined) {
          await this.helpers.deleteCached(
            CACHE_KEY_SERVICE_SEO(userId, current.slug),
            { appended_language: true },
          );
        }
        this.eventEmitter.emit(
          ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
          new ArtistPublicPagesChangedEvent(userId),
        );
      },
    });
  }
}
