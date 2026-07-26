import { Injectable } from "@nestjs/common";
// import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { Helpers } from "src/common/services/helpers.service";

import { FullPortfolio, Portfolio, PortfolioIndexRequest } from "@repo/common-lib/types/portfolio";
import { EntitySeoMetadata } from "@repo/common-lib/types/ai";
import { CACHE_KEY_PORTFOLIO_SEO, SEO_METADATA_CACHE_TTL } from "@repo/common-lib/constants/constants";

import { UserRepository } from "../users/users.repository";
import { PortfolioRepository } from "../portfolios/portfolio.repository";
import { CollectionService } from "../collections/collection.service";

@Injectable()
export class UserPortfolioService {

  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly userRepository: UserRepository,
    private readonly  collectionService: CollectionService,
    private readonly helpers: Helpers,
  ) { }

  async getById(userId: number, slug: string): Promise<FullPortfolio> {
    const portfolio = await this.portfolioRepository.getBySlug(slug, userId);
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
          url: media.url ? await this.helpers.getAsset(media.url) : undefined
        })))
        : portfolio.media,
    };
  }
  async getByUsername(username: string, slug: string): Promise<FullPortfolio> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return null;
    const portfolio = await this.portfolioRepository.getBySlug(slug, user.id);
    if (!portfolio) return null;

    if (portfolio.thumbnail) {
      portfolio.thumbnail = await this.helpers.getAsset(portfolio.thumbnail);
    }
    return {
      ...portfolio,
      collections: await this.collectionService.findPortfolioCollections(portfolio.id),
      media: portfolio.media.length
        ? await Promise.all(portfolio.media.map(async (media) => ({
          ...media,
          thumbnail: media.thumbnail ? await this.helpers.getAsset(media.thumbnail) : undefined,
          url: media.url ? await this.helpers.getAsset(media.url) : undefined,
        })))
        : portfolio.media,
    };
  }

  /**
   * Lean, locale-resolved SEO for `generateMetadata` — does not load the full portfolio graph.
   * Cached per (user, slug, language); invalidated on portfolio update.
   */
  async getSeoMetadata(username: string, slug: string): Promise<EntitySeoMetadata | null> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return null;
    // Cache the thumbnail PATH (stable), not the signed URL — the presigned URL expires (~1h) well
    // before this 24h cache would, so `og_image` is signed fresh per request outside the cache.
    const cached = await this.helpers.cacheRemember(
      CACHE_KEY_PORTFOLIO_SEO(user.id, slug),
      async () => {
        const meta = await this.portfolioRepository.getSeoMetadataBySlug(slug, user.id);
        if (!meta) return null;
        return {
          seo_title: meta.seo_title,
          seo_description: meta.seo_description,
          thumbnail_path: meta.thumbnail,
          canonical_path: `/artists/${username}/portfolios/${slug}`,
          noindex: !meta.is_indexable,
        };
      },
      { ttl: SEO_METADATA_CACHE_TTL, append_language: true },
    );
    if (!cached) return null;
    const { thumbnail_path, ...rest } = cached;
    return {
      ...rest,
      og_image: thumbnail_path ? await this.helpers.getAsset(thumbnail_path) : null,
    };
  }

  async getAllByUsername(
    username: string,
    filters?: Omit<PortfolioIndexRequest, 'user_id'>,
  ): Promise<Portfolio[]> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return [];

    console.log("FILTERS",filters)
    const portfolios = await this.portfolioRepository.getAll({ user_id: user.id, ...filters });



    return await Promise.all(portfolios.map(async (portfolio) => ({
      ...portfolio,
      thumbnail: portfolio.thumbnail ? await this.helpers.getAsset(portfolio.thumbnail) : undefined,
    })));
  }


  async slugExists(username: string, slug: string) {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return {
      exists: false,
    };
    return {
      exists: await this.portfolioRepository.slugExists(slug, user.id)
    }
  }



}
