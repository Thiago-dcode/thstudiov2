import { Injectable } from "@nestjs/common";
// import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { Helpers } from "src/common/services/helpers.service";

import { FullPortfolio } from "@repo/common-lib/types/portfolio";

import { UserRepository } from "../users/users.repository";
import { PortfolioRepository } from "../portfolios/portfolio.repository";

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

  async getById( userId: number,slug: string): Promise<FullPortfolio> {
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
        })))
        : portfolio.media,
    };
  }
  async getByUsername(username: string,slug: string): Promise<FullPortfolio> {
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
        })))
        : portfolio.media,
    };
  }


  async slugExists(slug: string, userId: number) {
    return {
      exists: await this.portfolioRepository.slugExists(slug, userId)
    }
  }



}