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
    if (!request.media || request.media.length === 0) {
      throw new BadRequestException('Collections must have at least 1 media');
    }

    if (request.media.length > MAX_COLLECTION_ITEMS) {
      throw new BadRequestException(`Collections can have up to ${MAX_COLLECTION_ITEMS} media`);
    }

    // Title first: it is the likeliest user error and the cheapest check.
    await this.assertTitleIsFree(request.title, request.user_id);
    const slug = await this.resolveSlug(request.title, request.user_id);

    await this.enforceHighlightLimit(request.user_id, request.is_highlight);

    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      collections_count: 1,
    });

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
    await QueueHelper.createComputeUserMetricsJob(request.user_id);
    await QueueHelper.createGenerateSingleEntityMetadataJob(
      {
        entity: 'collection',
        id: collection.id,
        user_id: collection.user_id,
      },
      { delay: SINGLE_ENTITY_METADATA_DEBOUNCE_MS },
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
    await QueueHelper.createComputeUserMetricsJob(collection.user_id);
  }
}
