import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { Helpers } from "src/common/services/helpers.service";
import { CreatePortfolioRequest } from "./requests/create-portfolio.request";
import { IndexPortfolioRequest } from "./requests/index-portfolio.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { PortfolioRepository } from "./portfolio.repository";
import { FullPortfolio } from "@repo/common-lib/types/portfolio";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UPDATE_USER_EXTRA_DATA_METRICS } from "@repo/common-lib/constants/constants";
import { UpdateUserExtraDataMetricsEvent } from "../user-extra-data/events/update-user-extra-data-metrics.event";

@Injectable()
export class PortfolioService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'portfolio',
  });
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    // private readonly userService: UserService,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    // private readonly compressService: CompressService,
    // private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
    private readonly helpers: Helpers,
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

  async getBySlug(slug: string, userId: number): Promise<FullPortfolio> {
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

  async slugExists(slug: string, userId: number) {
    return {
      exists: await this.portfolioRepository.slugExists(slug, userId)
    }
  }

  async create(request: CreatePortfolioRequest) {

    if (request.media?.length === 0 && request.collections?.length === 0) {
      throw new BadRequestException('Portfolios must have at least 1 media or 1 collection');
    }

    if ((await this.slugExists(request.slug, request.user_id)).exists) {

      throw new BadRequestException(`Slug ${request.slug} already exists`);
    }
    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      portfolios_count: 1,
    });
    let thumbnailPath = undefined;
    if (request.thumbnail) {
      thumbnailPath = `users/${this.requestService.user.public_id}/portfolio/${request.slug}/thumbnail.webp`;
      this.logger.info('Uploading thumbnail', { path: thumbnailPath });
      await this.helpers.setAsset({
        asset: request.thumbnail,
        path: thumbnailPath,
        targetSizeMb: 0.5,
        targetQuality: 85
      });
    }

    const portfolio = await this.portfolioRepository.create({
      ...request,
      thumbnail: thumbnailPath
    });
    this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(request.user_id));
    return portfolio;

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
    this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(portfolio.user_id));
  }

}