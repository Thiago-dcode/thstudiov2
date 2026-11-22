import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { MAX_HIGHLIGHT_COLLECTIONS } from "@repo/common-lib/constants/highlights";
import type { HighlightCount } from "@repo/common-lib/types/general";
import { CreateCollectionRequest } from "./requests/create-collection.request";
import { UpdateCollectionRequest } from "./requests/update-collection.request";
import { IndexCollectionRequest } from "./requests/index-collection.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { CollectionRepository } from "./collection.repository";
import { MAX_COLLECTION_ITEMS } from "@repo/common-lib/constants/limits";
import { CACHE_KEY_COLLECTION_SEO } from "@repo/common-lib/constants/cache";
import { QueueHelper, SINGLE_ENTITY_METADATA_DEBOUNCE_MS } from "@repo/backend-lib/utils";
import { Helpers } from "src/common/services/helpers.service";
import { ApiException } from "src/common/exceptions/api-exception";
import { FullPortfolioCollection } from "@repo/common-lib/types/collection";
import { insertWithUniqueSlug, resolveEntitySlug } from "src/common/utils/slug.util";
import { assertOwnedIds, classifyOwnedIds } from "src/common/utils/owned-ids.util";
import type { SortModulesResult } from "@repo/common-lib/types/sort-module";
import type { ModuleStatus } from "@repo/common-lib/types/module-status";
import { SortModulesRequest } from "src/common/requests/sort-modules.request";
import {
  UpdateModuleStatusRequest,
  hasModuleStatusChange,
} from "src/common/requests/update-module-status.request";
import type { ApiLogger } from "src/common/services/request.service";
import { ENTITY_CREATE_LOCK_TTL_MS, withUserLock } from "src/common/utils/user-lock";
import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { PublicViewerService } from "src/common/services/public-viewer.service";
import { PUBLIC_ENTITY_FILTERS } from "src/common/utils/public-entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from "@repo/common-lib/constants/events";
import { ArtistPublicPagesChangedEvent } from "../edge-cache/events/artist-public-pages-changed.event";

const CACHE_TTL = 1000 * 60 * 60 * 24;

export const collectionCacheKeys = {
  highlightCount: (userId: number) => `collection-highlight-count-${userId}`,
};

@Injectable()
export class CollectionService {
  private readonly reorderLog: ApiLogger;
  private readonly statusLog: ApiLogger;

  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly helper: Helpers,
    private readonly publicViewer: PublicViewerService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.reorderLog = this.requestService.log('collections', { operation: 'collection-reorder' });
    this.statusLog = this.requestService.log('collections', { operation: 'collection-status-update' });
  }

  /**
   * Public route, also the atelier's list (`user_id` = the caller). Anyone else gets only active,
   * unblocked collections of visible accounts, whatever `is_active`/`blocked` they ask for.
   */
  async findAll(data: IndexCollectionRequest) {
    const result = (await this.publicViewer.canSeeHidden(data.user_id))
      ? await this.collectionRepository.getAll(data)
      : await this.collectionRepository.getAll(
        // A list across every artist is always paged for visitors: unpaged, it is every
        // collection on the platform with every media row joined in.
        { ...data, ...PUBLIC_ENTITY_FILTERS, ...(data.user_id ? {} : { paginated: true }) },
        { visibleAccountsOnly: true },
      );
    return Promise.all(
      result.map(async (co) => {
        const media = await Promise.all(
          co.media.map(async (cm) => {
            if (!cm.thumbnail) return cm;
            return {
              ...cm,
              thumbnail: await this.helper.getAsset(cm.thumbnail),
            };
          }),
        );
        return { ...co, media };
      }),
    );
  }

  async findPortfolioCollections(portfolioId: number): Promise<FullPortfolioCollection[]> {
    const result = await this.collectionRepository.getPortfolioCollections(portfolioId);

    return Promise.all(
      result.map(async (col) => ({
        ...col,
        media: await Promise.all(
          col.media.map(async (me) => ({
            ...me,
            thumbnail: me.thumbnail ? await this.helper.getAsset(me.thumbnail) : undefined,
            video_preview: me.video_preview ? await this.helper.getAsset(me.video_preview) : undefined,
            url: me.url ? await this.helper.getAsset(me.url) : undefined,
          })),
        ),
      })),
    );
  }

  /**
   * Derives the collection's permanent slug from its title, resolving collisions within
   * this user's collections only (two artists may share a slug — their URLs differ by username).
   */
  private async resolveSlug(title: string, userId: number) {
    return resolveEntitySlug({
      title,
      fallbackPrefix: 'collection',
      exists: (candidate) => this.collectionRepository.slugExists(candidate, userId),
    });
  }

  private async assertTitleIsFree(title: string, userId: number, excludeId?: number) {
    if (await this.collectionRepository.titleExists(title, userId, excludeId)) {
      throw ApiException.titleAlreadyExists(
        'You already have a collection with this title. Please choose a different one.',
      );
    }
  }

  async countHighlights(): Promise<HighlightCount> {
    const userId = this.requestService.user.id;
    return this.helper.cacheRemember(
      collectionCacheKeys.highlightCount(userId),
      this.resolveHighlightCount(userId),
      { append_language: false, ttl: CACHE_TTL },
    );
  }

  private async resolveHighlightCount(userId: number): Promise<HighlightCount> {
    const count = await this.collectionRepository.countHighlights(userId);
    return { count };
  }

  private async invalidateHighlightCountCache(userId: number) {
    await this.helper.deleteCached(collectionCacheKeys.highlightCount(userId));
  }

  private async enforceHighlightLimit(
    userId: number,
    isHighlight: boolean | undefined,
    currentlyHighlighted = false,
  ) {
    if (isHighlight !== true || currentlyHighlighted) {
      return;
    }

    const count = await this.collectionRepository.countHighlights(userId);
    if (count >= MAX_HIGHLIGHT_COLLECTIONS) {
      throw ApiException.maxHighlights(
        `You can highlight up to ${MAX_HIGHLIGHT_COLLECTIONS} collections on your profile page`,
      );
    }
  }

  async create(request: CreateCollectionRequest) {
    // The cap check and the insert must not interleave with another create for the same user.
    return withUserLock(`create:collections:${request.user_id}`, ENTITY_CREATE_LOCK_TTL_MS, () =>
      this.createLocked(request),
    );
  }

  private async createLocked(request: CreateCollectionRequest) {
    if (!request.media || request.media.length === 0) {
      throw new BadRequestException('Collections must have at least 1 media');
    }

    if (request.media.length > MAX_COLLECTION_ITEMS) {
      throw new BadRequestException(`Collections can have up to ${MAX_COLLECTION_ITEMS} media`);
    }

    // Title first: it is the likeliest user error and the cheapest check.
    await this.assertTitleIsFree(request.title, request.user_id);
    await assertOwnedIds(TABLES_ENUM.MEDIA, request.media.map((m) => m.id), request.user_id, 'Media');
    const slug = await this.resolveSlug(request.title, request.user_id);

    await this.enforceHighlightLimit(request.user_id, request.is_highlight);

    await this.userExtraDataService.enforceEntityLimit(request.user_id, 'collections');

    const collection = await insertWithUniqueSlug(
      slug,
      () => this.resolveSlug(request.title, request.user_id),
      (resolvedSlug) =>
        this.collectionRepository.create({
          title: request.title,
          slug: resolvedSlug,
          description: request.description,
          user_id: request.user_id,
          is_highlight: request.is_highlight ?? false,
          is_active: request.is_active ?? true,
          media: request.media,
        }),
    );
    await this.invalidateHighlightCountCache(request.user_id);
    await QueueHelper.createComputeUserMetricsJob(request.user_id, this.requestService.traceCarrier());
    await QueueHelper.createGenerateSingleEntityMetadataJob(
      {
        entity: 'collection',
        id: collection.id,
        user_id: collection.user_id,
      },
      { delay: SINGLE_ENTITY_METADATA_DEBOUNCE_MS },
      this.requestService.traceCarrier(),
    );
    this.eventEmitter.emit(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      new ArtistPublicPagesChangedEvent(request.user_id),
    );
    return collection;
  }

  async update(id: number, request: UpdateCollectionRequest) {
    const collection = await this.collectionRepository.getOneCompact(id);

    if (!collection) {
      throw new BadRequestException('Collection not found');
    }

    if (collection.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    await this.enforceHighlightLimit(
      collection.user_id,
      request.is_highlight,
      collection.is_highlight,
    );

    if (!request.media || request.media.length === 0) {
      throw new BadRequestException('Collections must have at least 1 media');
    }

    if (request.media.length > MAX_COLLECTION_ITEMS) {
      throw new BadRequestException(`Collections can have up to ${MAX_COLLECTION_ITEMS} media`);
    }
    await assertOwnedIds(TABLES_ENUM.MEDIA, request.media.map((m) => m.id), collection.user_id, 'Media');

    // The slug is frozen at creation and never re-derived here, so only the title needs checking.
    // `id` is excluded so re-saving an unchanged title is not rejected as a self-collision.
    if (request.title) {
      await this.assertTitleIsFree(request.title, collection.user_id, id);
    }

    // `request` is spread wholesale, so `slug` must not be a field on the DTO — `updateById`
    // builds its column list from Object.keys() and would persist a stray undefined as NULL.
    const updated = await this.collectionRepository.updateById(id, {
      ...request,
      media: request.media,
    });
    await this.invalidateHighlightCountCache(collection.user_id);

    // Content changed → drop cached SEO metadata (all locales). The slug is immutable,
    // so there is only ever one key to invalidate.
    await this.helper.deleteCached(
      CACHE_KEY_COLLECTION_SEO(collection.user_id, collection.slug),
      { appended_language: true },
    );
    this.eventEmitter.emit(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      new ArtistPublicPagesChangedEvent(collection.user_id),
    );

    return updated;
  }

  /**
   * Saves the order the artist dragged their collections into. A partial list is allowed: rows that
   * are not sent keep their position. Another owner's id is answered exactly like a missing one,
   * so the response is not an ownership oracle, but it is logged `critical` because the UI can
   * only ever send the caller's own ids.
   */
  async updatePositions(request: SortModulesRequest): Promise<SortModulesResult> {
    const userId = this.requestService.user.id;
    const itemCount = request.items.length;
    this.reorderLog.info('Collection reorder started', { user_id: userId, item_count: itemCount });

    const { missing, foreign } = await classifyOwnedIds(
      TABLES_ENUM.COLLECTIONS,
      request.items.map((item) => item.module_id),
      userId,
    );
    if (foreign.length) {
      // Counts only: never the other owner's ids.
      this.reorderLog.critical('Collection reorder targeted foreign collections', {
        user_id: userId,
        item_count: itemCount,
        foreign_count: foreign.length,
        step: 'ownership',
      });
      throw new BadRequestException('Collection not found');
    }
    if (missing.length) {
      throw new BadRequestException('Collection not found');
    }

    const updatedCount = await this.collectionRepository.updatePositions(userId, request.items);
    if (updatedCount > 0) {
      this.eventEmitter.emit(
        ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
        new ArtistPublicPagesChangedEvent(userId),
      );
    }

    this.reorderLog.success('Collection reorder completed', {
      user_id: userId,
      item_count: itemCount,
      updated_count: updatedCount,
    });
    return { updated_count: updatedCount };
  }

  /**
   * Quick toggle of `is_highlight` / `is_active` from the atelier card. Unlike `update()` it
   * rewrites nothing else (that one replaces the media list), and mirrors its side effects:
   * highlight-count cache, SEO-metadata cache (its noindex depends on `is_active`) and the edge purge.
   */
  async updateStatus(id: number, request: UpdateModuleStatusRequest): Promise<ModuleStatus> {
    if (!hasModuleStatusChange(request)) {
      throw new BadRequestException('Nothing to update');
    }
    const userId = this.requestService.user.id;
    const fields = (['is_highlight', 'is_active'] as const).filter((key) => request[key] !== undefined);
    this.statusLog.info('Collection status update started', {
      user_id: userId,
      collection_id: id,
      fields: fields.join(','),
    });

    const current = await this.collectionRepository.getOneCompact(id);
    if (!current) {
      throw new BadRequestException('Collection not found');
    }
    if (current.user_id !== userId) {
      this.statusLog.critical('Collection status update targeted a foreign collection', {
        user_id: userId,
        collection_id: id,
        step: 'ownership',
      });
      throw new BadRequestException('Collection not found');
    }

    await this.enforceHighlightLimit(userId, request.is_highlight, current.is_highlight);

    const updated = await this.collectionRepository.updateStatus(id, userId, request);
    const result: ModuleStatus = updated ?? {
      id,
      is_highlight: current.is_highlight,
      is_active: current.is_active,
    };

    if (updated) {
      if (request.is_highlight !== undefined) {
        await this.invalidateHighlightCountCache(userId);
      }
      if (request.is_active !== undefined) {
        await this.helper.deleteCached(
          CACHE_KEY_COLLECTION_SEO(userId, current.slug),
          { appended_language: true },
        );
      }
      this.eventEmitter.emit(
        ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
        new ArtistPublicPagesChangedEvent(userId),
      );
    }

    this.statusLog.success('Collection status updated', {
      user_id: userId,
      collection_id: id,
      is_highlight: result.is_highlight,
      is_active: result.is_active,
      changed: updated !== null,
    });
    return result;
  }

  async delete(id: number) {
    const collection = await this.collectionRepository.getOneCompact(id);

    if (!collection) {
      throw new BadRequestException();
    }

    if (collection.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    await this.collectionRepository.delete(id);
    await this.invalidateHighlightCountCache(collection.user_id);
    await QueueHelper.createComputeUserMetricsJob(collection.user_id, this.requestService.traceCarrier());
    this.eventEmitter.emit(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      new ArtistPublicPagesChangedEvent(collection.user_id),
    );
  }
}
