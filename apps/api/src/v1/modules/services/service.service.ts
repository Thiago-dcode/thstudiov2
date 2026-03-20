import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { FactoryLogService } from "@repo/backend-lib/services/log-service";
import { Helpers } from "src/common/services/helpers.service";
import { CreateServiceRequest } from "./requests/create-service.request";
import { UpdateServiceRequest } from "./requests/update-service.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { ServiceRepository } from "./service.repository";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UPDATE_USER_EXTRA_DATA_METRICS } from "@repo/common-lib/constants/constants";
import { UpdateUserExtraDataMetricsEvent } from "../user-extra-data/events/update-user-extra-data-metrics.event";
import { AiService } from "../ai/ai.service";
import { MediaModerationException } from "src/common/exceptions/media-moderation-exception";
import { serviceCacheKeys } from "../user-services/user-service.service";
import { cleanObj } from "@repo/common-lib/utils/cleanObj";

@Injectable()
export class ServiceService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'service',
  });

  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly eventEmitter: EventEmitter2,
    private readonly helpers: Helpers,
    private readonly aiService: AiService,
  ) { }

  private async slugExists(slug: string, userId: number) {
    return {
      exists: await this.serviceRepository.slugExists(slug, userId),
    };
  }

  async create(request: CreateServiceRequest) {
    if ((await this.slugExists(request.slug, request.user_id)).exists) {
      throw new BadRequestException(`Slug ${request.slug} already exists`);
    }

    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      services_count: 1,
    });

    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      thumbnailPath = `users/${this.requestService.user.public_id}/services/${request.slug}/thumbnail.webp`;
      this.logger.info('Uploading thumbnail', { path: thumbnailPath });

      await this.helpers.setAsset({
        asset: request.thumbnail,
        path: thumbnailPath,
        targetSizeMb: 0.5,
        targetQuality: 85,
      });

      const thumbnailUrl = await this.helpers.getAsset(thumbnailPath);
      const { moderation } = await this.aiService.moderateContent(thumbnailUrl, {
        user_id: request.user_id,
      });

      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(thumbnailPath);
        throw new MediaModerationException(moderation.reason);
      }
    }

    cleanObj(request)
    const { thumbnail, ...rest } = request;

    const service = await this.serviceRepository.create({
      ...rest,
      is_active: rest.is_active ?? true,
      show_price: rest.show_price ?? false,
      thumbnail: thumbnailPath,
    });

    await this.helpers.deleteManyCached([
      serviceCacheKeys.allByUser(request.user_id),
    ]);

    this.eventEmitter.emit(
      UPDATE_USER_EXTRA_DATA_METRICS,
      new UpdateUserExtraDataMetricsEvent(request.user_id),
    );

    return service;
  }

  async update(id: number, request: UpdateServiceRequest) {
    const service = await this.serviceRepository.getOneCompact(id);

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    if (service.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    if (request.slug && request.slug !== service.slug) {
      if ((await this.slugExists(request.slug, service.user_id)).exists) {
        throw new BadRequestException(`Slug ${request.slug} already exists`);
      }
    }

    let thumbnailPath: string | undefined;
    if (request.thumbnail) {
      const slug = request.slug ?? service.slug;
      thumbnailPath = `users/${this.requestService.user.public_id}/services/${slug}/thumbnail.webp`;
      this.logger.info('Uploading thumbnail', { path: thumbnailPath });

      if (service.thumbnail) {
        await this.helpers.deleteAsset(service.thumbnail);
      }

      await this.helpers.setAsset({
        asset: request.thumbnail,
        path: thumbnailPath,
        targetSizeMb: 0.5,
        targetQuality: 85,
      });

      const thumbnailUrl = await this.helpers.getAsset(thumbnailPath);
      const { moderation } = await this.aiService.moderateContent(thumbnailUrl, {
        user_id: service.user_id,
      });

      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(thumbnailPath);
        throw new MediaModerationException(moderation.reason);
      }
    }

    cleanObj(request);
    const { thumbnail, ...rest } = request;
    console.log("REST",rest);
    const updated = await this.serviceRepository.updateById(id, {
      ...rest,
      ...(thumbnailPath ? { thumbnail: thumbnailPath } : {}),
    });

    const keysToInvalidate = [
      serviceCacheKeys.bySlug(service.user_id, service.slug),
      serviceCacheKeys.allByUser(service.user_id),
    ];
    if (request.slug && request.slug !== service.slug) {
      keysToInvalidate.push(serviceCacheKeys.bySlug(service.user_id, request.slug));
    }
    await this.helpers.deleteManyCached(keysToInvalidate);

    return updated;
  }
}
