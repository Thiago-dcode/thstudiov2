import { Injectable } from "@nestjs/common";
// import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { Helpers } from "src/common/services/helpers.service";

import { FullPortfolio, Portfolio, PortfolioIndexRequest } from "@repo/common-lib/types/portfolio";

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
      collections:await this.collectionService.findPortfolioCollections(portfolio.id),
      media: portfolio.media.length
        ? await Promise.all(portfolio.media.map(async (media) => ({
          ...media,
          thumbnail: media.thumbnail ? await this.helpers.getAsset(media.thumbnail) : undefined,
          url: media.url ? await this.helpers.getAsset(media.url) : undefined,
        })))
        : portfolio.media,
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