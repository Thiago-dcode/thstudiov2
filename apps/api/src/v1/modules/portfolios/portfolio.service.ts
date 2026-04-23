import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { Helpers } from "src/common/services/helpers.service";
import { CreatePortfolioRequest } from "./requests/create-portfolio.request";
import { UpdatePortfolioRequest } from "./requests/update-portfolio.request";
import { IndexPortfolioRequest } from "./requests/index-portfolio.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { PortfolioRepository } from "./portfolio.repository";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UPDATE_USER_EXTRA_DATA_METRICS } from "@repo/common-lib/constants/constants";
import { UpdateUserExtraDataMetricsEvent } from "../user-extra-data/events/update-user-extra-data-metrics.event";
import { AiService } from "../ai/ai.service";
import { MediaModerationException } from "src/common/exceptions/media-moderation-exception";

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

  private async slugExists(slug: string, userId: number) {
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

    const portfolio = await this.portfolioRepository.create({
      ...request,
      thumbnail: thumbnailPath,
      is_highlight: request.is_highlight ?? false,
      is_active: request.is_active ?? true,
    });
    this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(request.user_id));
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

    // Update is atomic: media and collections are fully replaced, so at least 1 must be provided
    if ((!request.media || request.media.length === 0) && (!request.collections || request.collections.length === 0)) {
      throw new BadRequestException('Portfolios must have at least 1 media or 1 collection');
    }

    // Validate slug uniqueness if slug is being changed
    if (request.slug && request.slug !== portfolio.slug) {
      if ((await this.slugExists(request.slug, portfolio.user_id)).exists) {
        throw new BadRequestException(`Slug ${request.slug} already exists`);
      }
    }

    // Handle thumbnail upload if a new one is provided
    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      const slug = request.slug ?? portfolio.slug;
      thumbnailPath = `users/${this.requestService.user.public_id}/portfolio/${slug}/thumbnail.webp`;
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

    const { thumbnail, media, collections, ...rest } = request;

    const updated = await this.portfolioRepository.updateById(id, {
      ...rest,
      ...(thumbnailPath ? { thumbnail: thumbnailPath } : {}),
      media: media ?? [],
      collections: collections ?? [],
    });

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
    this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(portfolio.user_id));
  }

}