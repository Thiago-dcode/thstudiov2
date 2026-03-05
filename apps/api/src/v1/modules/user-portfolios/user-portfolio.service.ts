import { Injectable } from "@nestjs/common";
// import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { Helpers } from "src/common/services/helpers.service";

import { FullPortfolio, Portfolio } from "@repo/common-lib/types/portfolio";

import { UserRepository } from "../users/users.repository";
import { PortfolioRepository } from "../portfolios/portfolio.repository";
import { exists } from "nestjs-i18n/dist/utils";

@Injectable()
export class UserPortfolioService {
  // private readonly logger = FactoryLogService.createLogService('file', {
  //   channel: 'portfolio',
  // });
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    private readonly userRepository: UserRepository,
    // private readonly userService: UserService,
    // private readonly compressService: CompressService,
    // private readonly storageService: StorageService,
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
    const user = await this.userRepository.findOneBy('username', username, 'COMPACT');
    if (!user) return null;
    const portfolio = await this.portfolioRepository.getBySlug(slug, user.id);
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
  }

  async getAllByUsername(username: string): Promise<Portfolio[]> {
    const user = await this.userRepository.findByUsernameCompact(username);
    if (!user) return [];

    const portfolios = await this.portfolioRepository.getAll({ user_id: user.id });

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