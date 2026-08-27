import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { MAX_HIGHLIGHT_PORTFOLIOS } from "@repo/common-lib/constants/highlights";
import type { HighlightCount } from "@repo/common-lib/types/general";
import type { FullPortfolio } from "@repo/common-lib/types/portfolio";
import { Helpers } from "src/common/services/helpers.service";
import { CreatePortfolioRequest } from "./requests/create-portfolio.request";
import { UpdatePortfolioRequest } from "./requests/update-portfolio.request";
import { IndexPortfolioRequest } from "./requests/index-portfolio.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { PortfolioRepository } from "./portfolio.repository";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MAX_PORTFOLIO_ITEMS } from "@repo/common-lib/constants/limits";
import { UPDATE_PROFILE_STATUS_EVENT } from "@repo/common-lib/constants/events";
import { CACHE_KEY_PORTFOLIO_SEO } from "@repo/common-lib/constants/cache";
import { QueueHelper, SINGLE_ENTITY_METADATA_DEBOUNCE_MS } from "@repo/backend-lib/utils";
import { TABLES_ENUM } from "@repo/common-lib/constants/enums";
import { UpdateProfileStatusEvent } from "../profile-status/events/update-profile-status.event";
import { AiService } from "../ai/ai.service";
import { MediaModerationException } from "src/common/exceptions/media-moderation-exception";
import { ApiException } from "src/common/exceptions/api-exception";
import { Query } from "@repo/database/facades";
import { LayoutService } from "../layouts/layout.service";
import { insertWithUniqueSlug, resolveEntitySlug } from "src/common/utils/slug.util";
import { versionedAssetPath } from "src/common/utils/asset-path.util";

const CACHE_TTL = 1000 * 60 * 60 * 24;

/** Half an hour; see `findFeatured`. */
const FEATURED_PORTFOLIO_CACHE_TTL = 1000 * 60 * 30;

export const portfolioCacheKeys = {
  highlightCount: (userId: number) => `portfolio-highlight-count-${userId}`,
};

/** Not user-scoped: one featured portfolio is shown to everyone. */
export const FEATURED_PORTFOLIO_CACHE_KEY = 'portfolio-featured';

@Injectable()
export class PortfolioService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'portfolio',
  });
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly eventEmitter: EventEmitter2,
    private readonly helpers: Helpers,
    private readonly aiService: AiService,
    private readonly layoutService: LayoutService,
  ) { }

  async findAll(data: IndexPortfolioRequest) {
    const result = await this.portfolioRepository.getAll(data);
    return await Promise.all(
      result.map(async (portfolio) => {
        if (portfolio.thumbnail) {
          portfolio.thumbnail = await this.helpers.getAsset(portfolio.thumbnail);
        }
        return portfolio;
      }),
    );
  }

  /**
   * Rendered on every landing page view and identical for every visitor, but was re-querying the
   * database and re-resolving every media URL each time.
   *
   * The TTL is the only invalidation: nothing in the API writes `portfolios.is_featured`, so there
   * is no request to hang a `deleteCached` off — the flag is flipped directly in the database. Half
   * an hour is the resulting worst-case delay before a newly featured portfolio appears; to publish
   * sooner, drop the `portfolio-featured` key from Redis.
   */
  async findFeatured(): Promise<FullPortfolio | null> {
    return this.helpers.cacheRemember(
      FEATURED_PORTFOLIO_CACHE_KEY,
      async () => {
        const portfolio = await this.portfolioRepository.getFeatured();
        if (!portfolio) return null;

        if (portfolio.thumbnail) {
          portfolio.thumbnail = await this.helpers.getAsset(portfolio.thumbnail);
        }

        return {
          ...portfolio,
          media: portfolio.media.length
            ? await Promise.all(portfolio.media.map(async (media) => ({
              ...media,
              thumbnail: media.thumbnail ? await this.helpers.getAsset(media.thumbnail) : undefined,
              url: media.url ? await this.helpers.getAsset(media.url) : undefined,
            })))
            : portfolio.media,
        };
      },
      { ttl: FEATURED_PORTFOLIO_CACHE_TTL },
    );
  }

  /**
   * Derives the portfolio's permanent slug from its title, resolving collisions within
   * this user's portfolios only (two artists may share a slug — their URLs differ by username).
   * Must run before any slug-derived storage path is built.
   */
  private async resolveSlug(title: string, userId: number) {
    return resolveEntitySlug({
      title,
      fallbackPrefix: 'portfolio',
      exists: (candidate) => this.portfolioRepository.slugExists(candidate, userId),
    });
  }

  private async assertTitleIsFree(title: string, userId: number, excludeId?: number) {
    if (await this.portfolioRepository.titleExists(title, userId, excludeId)) {
      throw ApiException.titleAlreadyExists(
        'You already have a portfolio with this title. Please choose a different one.',
      );
    }
  }

  async countHighlights(): Promise<HighlightCount> {
    const userId = this.requestService.user.id;
    return this.helpers.cacheRemember(
      portfolioCacheKeys.highlightCount(userId),
      // Factory, not a started promise: passing the promise ran the query even on a cache hit,
      // and the hit path never awaited it — so a rejection surfaced as an unhandled rejection.
      () => this.resolveHighlightCount(userId),
      { append_language: false, ttl: CACHE_TTL },
    );
  }

  private async resolveHighlightCount(userId: number): Promise<HighlightCount> {
    const count = await this.portfolioRepository.countHighlights(userId);
    return { count };
  }

  private async invalidateHighlightCountCache(userId: number) {
    await this.helpers.deleteCached(portfolioCacheKeys.highlightCount(userId));
  }

  private async enforceHighlightLimit(
    userId: number,
    isHighlight: boolean | undefined,
    currentlyHighlighted = false,
  ) {
    if (isHighlight !== true || currentlyHighlighted) {
      return;
    }

    const count = await this.portfolioRepository.countHighlights(userId);
    if (count >= MAX_HIGHLIGHT_PORTFOLIOS) {
      throw ApiException.maxHighlights(
        `You can highlight up to ${MAX_HIGHLIGHT_PORTFOLIOS} portfolios on your profile page`,
      );
    }
  }

  private async enforcePortfolioItemsLimit(
    collectionIds: number[],
    mediaIds: number[],
  ) {
    const collectionMediaCount = collectionIds.length
      ? await Query.table(TABLES_ENUM.COLLECTION_MEDIA)
        .whereIn('collection_id', collectionIds)
        .count()
      : 0;

    const totalItemCount = mediaIds.length + collectionMediaCount;

    if (totalItemCount > MAX_PORTFOLIO_ITEMS) {
      throw ApiException.maxPortfolioItems(
        `Portfolios can have up to ${MAX_PORTFOLIO_ITEMS} items`,
      );
    }
  }

  async create(request: CreatePortfolioRequest) {

    if (request.media?.length === 0 && request.collections?.length === 0) {
      throw new BadRequestException('Portfolios must have at least 1 media or 1 collection');
    }

    await this.enforcePortfolioItemsLimit(
      request.collections?.map((collection) => collection.id) ?? [],
      request.media?.map((media) => media.id) ?? [],
    );

    // Title first: it is the likeliest user error and the cheapest check, so it fails
    // before any upload or limit accounting happens.
    await this.assertTitleIsFree(request.title, request.user_id);
    const slug = await this.resolveSlug(request.title, request.user_id);

    await this.enforceHighlightLimit(request.user_id, request.is_highlight);
    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      portfolios_count: 1,
    });

    const resolvedLayout = await this.layoutService.resolveLayoutConfig(
      request.layout?.layout_id,
      request.layout?.config,
    );

    let thumbnailPath = undefined;
    if (request.thumbnail) {
      thumbnailPath = versionedAssetPath(
        `users/${this.requestService.user.public_id}/portfolio/${slug}/thumbnail.webp`,
      );
      this.logger.info('Uploading thumbnail', { path: thumbnailPath });
      await this.helpers.setAsset({
        asset: request.thumbnail,
        path: thumbnailPath,
        targetSizeMb: 0.5,
        targetQuality: 85
      });

      // Moderate content using the stored thumbnail
      const thumbnailUrl = await this.helpers.getAsset(thumbnailPath);
      const { moderation } = await this.aiService.moderateContent(thumbnailUrl, {
        user_id: request.user_id,
      });

      // If not allowed → delete thumbnail and throw
      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(thumbnailPath);
        throw new MediaModerationException(moderation.reason);
      }
    }

    const portfolio = await insertWithUniqueSlug(
      slug,
      () => this.resolveSlug(request.title, request.user_id),
      (resolvedSlug) =>
        this.portfolioRepository.create({
          title: request.title,
          slug: resolvedSlug,
          description: request.description,
          user_id: request.user_id,
          media: request.media,
          collections: request.collections,
          categories: request.categories,
          thumbnail: thumbnailPath,
          is_highlight: request.is_highlight ?? false,
          is_active: request.is_active ?? true,
        }),
    );
    await this.layoutService.persistConfig(
      resolvedLayout.layout,
      portfolio.id,
      resolvedLayout.config,
    );
    await this.invalidateHighlightCountCache(request.user_id);
    await QueueHelper.createComputeUserMetricsJob(request.user_id);
    this.eventEmitter.emit(
      UPDATE_PROFILE_STATUS_EVENT,
      new UpdateProfileStatusEvent(request.user_id, { has_portfolio: true }),
    );
    await QueueHelper.createGenerateSingleEntityMetadataJob(
      {
        entity: 'portfolio',
        id: portfolio.id,
        user_id: portfolio.user_id,
      },
      { delay: SINGLE_ENTITY_METADATA_DEBOUNCE_MS },
    );
    return portfolio;

  }

  async update(id: number, request: UpdatePortfolioRequest) {
    const portfolio = await this.portfolioRepository.getOneCompact(id);

    if (!portfolio) {
      throw new BadRequestException('Portfolio not found');
    }

    if (portfolio.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    await this.enforceHighlightLimit(
      portfolio.user_id,
      request.is_highlight,
      portfolio.is_highlight,
    );

    // Update is atomic: media and collections are fully replaced, so at least 1 must be provided
    if ((!request.media || request.media.length === 0) && (!request.collections || request.collections.length === 0)) {
      throw new BadRequestException('Portfolios must have at least 1 media or 1 collection');
    }

    await this.enforcePortfolioItemsLimit(
      request.collections?.map((collection) => collection.id) ?? [],
      request.media?.map((media) => media.id) ?? [],
    );

    // The slug is frozen at creation and never re-derived here, so only the title needs checking.
    // `id` is excluded so re-saving an unchanged title is not rejected as a self-collision.
    if (request.title) {
      await this.assertTitleIsFree(request.title, portfolio.user_id, id);
    }

    const resolvedLayout = request.layout
      ? await this.layoutService.resolveLayoutConfig(
        request.layout.layout_id,
        request.layout.config,
      )
      : null;

    // Handle thumbnail upload if a new one is provided
    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      // Each upload gets its own key so the CDN URL changes — overwriting in place left every
      // cache serving the old image. The previous object must therefore be deleted explicitly.
      thumbnailPath = versionedAssetPath(
        `users/${this.requestService.user.public_id}/portfolio/${portfolio.slug}/thumbnail.webp`,
      );
      this.logger.info('Uploading thumbnail', { path: thumbnailPath });

      // Delete old thumbnail if it exists
      if (portfolio.thumbnail) {
        await this.helpers.deleteAsset(portfolio.thumbnail);
      }

      await this.helpers.setAsset({
        asset: request.thumbnail,
        path: thumbnailPath,
        targetSizeMb: 0.5,
        targetQuality: 85,
      });

      // Moderate content using the stored thumbnail
      const thumbnailUrl = await this.helpers.getAsset(thumbnailPath);
      const { moderation } = await this.aiService.moderateContent(thumbnailUrl, {
        user_id: portfolio.user_id,
      });

      // If not allowed → delete thumbnail and throw
      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(thumbnailPath);
        throw new MediaModerationException(moderation.reason);
      }
    }

    // Never write `slug` here. `updateById` builds its column list from Object.keys() without
    // filtering undefined, so a present-but-undefined key would be bound and persisted as NULL.
    const updated = await this.portfolioRepository.updateById(id, {
      title: request.title,
      description: request.description,
      is_highlight: request.is_highlight,
      is_active: request.is_active,
      ...(thumbnailPath ? { thumbnail: thumbnailPath } : {}),
      media: request.media ?? [],
      collections: request.collections ?? [],
      categories: request.categories,
    });

    if (resolvedLayout) {
      await this.layoutService.persistConfig(
        resolvedLayout.layout,
        id,
        resolvedLayout.config,
      );
    }

    await this.invalidateHighlightCountCache(portfolio.user_id);

    // Content changed → drop cached SEO metadata (all locales). The slug is immutable,
    // so there is only ever one key to invalidate.
    await this.helpers.deleteCached(
      CACHE_KEY_PORTFOLIO_SEO(portfolio.user_id, portfolio.slug),
      { appended_language: true },
    );

    return updated;
  }

  async delete(id: number) {

    const portfolio = await this.portfolioRepository.getOneCompact(id);

    if (!portfolio) {
      throw new BadRequestException();
    }

    if (portfolio.user_id !== this.requestService.user.id) {

      throw new UnauthorizedException();
    }

    await Promise.all([
      portfolio.thumbnail ? this.helpers.deleteAsset(portfolio.thumbnail) : undefined,
      this.portfolioRepository.delete(id),
    ]);
    await this.invalidateHighlightCountCache(portfolio.user_id);
    await QueueHelper.createComputeUserMetricsJob(portfolio.user_id);
    const stillHasPortfolio = await this.portfolioRepository.exists({
      user_id: portfolio.user_id,
    });
    this.eventEmitter.emit(
      UPDATE_PROFILE_STATUS_EVENT,
      new UpdateProfileStatusEvent(portfolio.user_id, {
        has_portfolio: stillHasPortfolio,
      }),
    );
  }

}