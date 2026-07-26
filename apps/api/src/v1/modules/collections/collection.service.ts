import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { MAX_HIGHLIGHT_COLLECTIONS } from "@repo/common-lib/constants/highlights";
import type { HighlightCount } from "@repo/common-lib/types/general";
import { CreateCollectionRequest } from "./requests/create-collection.request";
import { UpdateCollectionRequest } from "./requests/update-collection.request";
import { IndexCollectionRequest } from "./requests/index-collection.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { CollectionRepository } from "./collection.repository";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CACHE_KEY_COLLECTION_SEO, GENERATE_SINGLE_ENTITY_METADATA_EVENT, MAX_COLLECTION_ITEMS, UPDATE_USER_EXTRA_DATA_METRICS } from "@repo/common-lib/constants/constants";
import { UpdateUserExtraDataMetricsEvent } from "../user-extra-data/events/update-user-extra-data-metrics.event";
import { GenerateSingleEntityMetadataEvent } from "../ai/events/generate-single-entity-metadata.event";
import { Helpers } from "src/common/services/helpers.service";
import { ApiException } from "src/common/exceptions/api-exception";
import { FullPortfolioCollection } from "@repo/common-lib/types/collection";

const CACHE_TTL = 1000 * 60 * 60 * 24;

export const collectionCacheKeys = {
  highlightCount: (userId: number) => `collection-highlight-count-${userId}`,
};

@Injectable()
export class CollectionService {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly helper: Helpers,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async findAll(data: IndexCollectionRequest) {
    const result = await this.collectionRepository.getAll(data);
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
            url: me.url ? await this.helper.getAsset(me.url) : undefined,
          })),
        ),
      })),
    );
  }

  private async slugExists(slug: string, userId: number) {
    return {
      exists: await this.collectionRepository.slugExists(slug, userId)
    };
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
    if (!request.media || request.media.length === 0) {
      throw new BadRequestException('Collections must have at least 1 media');
    }

    if (request.media.length > MAX_COLLECTION_ITEMS) {
      throw new BadRequestException(`Collections can have up to ${MAX_COLLECTION_ITEMS} media`);
    }

    if ((await this.slugExists(request.slug, request.user_id)).exists) {
      throw new BadRequestException(`Slug ${request.slug} already exists`);
    }

    await this.enforceHighlightLimit(request.user_id, request.is_highlight);

    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      collections_count: 1,
    });

    const collection = await this.collectionRepository.create({
      title: request.title,
      slug: request.slug,
      description: request.description,
      user_id: request.user_id,
      is_highlight: request.is_highlight ?? false,
      is_active: request.is_active ?? true,
      media: request.media,
    });
    await this.invalidateHighlightCountCache(request.user_id);
    this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(request.user_id));
    this.eventEmitter.emit(
      GENERATE_SINGLE_ENTITY_METADATA_EVENT,
      new GenerateSingleEntityMetadataEvent({
        entity: 'collection',
        id: collection.id,
        user_id: collection.user_id,
      }),
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

    if (request.slug && request.slug !== collection.slug) {
      if ((await this.slugExists(request.slug, collection.user_id)).exists) {
        throw new BadRequestException(`Slug ${request.slug} already exists`);
      }
    }

    const updated = await this.collectionRepository.updateById(id, {
      ...request,
      media: request.media,
    });
    await this.invalidateHighlightCountCache(collection.user_id);

    // Content changed → drop cached SEO metadata (old + new slug, all locales).
    for (const s of new Set(
      [collection.slug, request.slug].filter(Boolean) as string[],
    )) {
      await this.helper.deleteCached(CACHE_KEY_COLLECTION_SEO(collection.user_id, s), {
        appended_language: true,
      });
    }

    return updated;
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
    this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(collection.user_id));
  }
}
