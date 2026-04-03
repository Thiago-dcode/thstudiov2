import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateCollectionRequest } from "./requests/create-collection.request";
import { UpdateCollectionRequest } from "./requests/update-collection.request";
import { IndexCollectionRequest } from "./requests/index-collection.request";
import { UserExtraDataService } from "../user-extra-data/user-extra-data.service";
import { RequestService } from "src/common/services/request.service";
import { CollectionRepository } from "./collection.repository";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UPDATE_USER_EXTRA_DATA_METRICS } from "@repo/common-lib/constants/constants";
import { UpdateUserExtraDataMetricsEvent } from "../user-extra-data/events/update-user-extra-data-metrics.event";

const MAX_COLLECTION_MEDIA = 50;

@Injectable()
export class CollectionService {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async findAll(data: IndexCollectionRequest) {
    return await this.collectionRepository.getAll(data);
  }

  private async slugExists(slug: string, userId: number) {
    return {
      exists: await this.collectionRepository.slugExists(slug, userId)
    };
  }

  async create(request: CreateCollectionRequest) {
    if (!request.media || request.media.length === 0) {
      throw new BadRequestException('Collections must have at least 1 media');
    }

    if (request.media.length > MAX_COLLECTION_MEDIA) {
      throw new BadRequestException(`Collections can have up to ${MAX_COLLECTION_MEDIA} media`);
    }

    if ((await this.slugExists(request.slug, request.user_id)).exists) {
      throw new BadRequestException(`Slug ${request.slug} already exists`);
    }

    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      collections_count: 1,
    });

    const collection = await this.collectionRepository.create(request);
    this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(request.user_id));
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

    if (!request.media || request.media.length === 0) {
      throw new BadRequestException('Collections must have at least 1 media');
    }

    if (request.media.length > MAX_COLLECTION_MEDIA) {
      throw new BadRequestException(`Collections can have up to ${MAX_COLLECTION_MEDIA} media`);
    }

    if (request.slug && request.slug !== collection.slug) {
      if ((await this.slugExists(request.slug, collection.user_id)).exists) {
        throw new BadRequestException(`Slug ${request.slug} already exists`);
      }
    }

    return await this.collectionRepository.updateById(id, {
      ...request,
      media: request.media,
    });
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
    this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(collection.user_id));
  }
}
