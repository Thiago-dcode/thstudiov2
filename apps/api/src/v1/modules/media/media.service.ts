import { BadRequestException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MediaRepository } from './media.repository';
import { CreateMediaRequest } from './requests/create-media.request';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { CompressService } from '@repo/backend-lib/services/compress-service/base';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { UserService } from '../users/users.service';
import { AiService } from '../ai/ai.service';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { bytesToMB, mbToBytes } from '@repo/common-lib/utils/bytes';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import path from 'path';
import { CreateMediaInput } from '@repo/common-lib/types/media';
import { cleanObj } from '@repo/common-lib/utils/cleanObj';
import { CREATE_USER_STORAGE_REQUEST } from '@repo/common-lib/constants/constants';
import { CreateUserStorageRequestEvent } from '../user-storage-requests/events/create-user-storage-request.event';
import { IndexMediaRequest } from '../user-media/requests/index-media.request';
import { Helpers } from 'src/common/services/helpers.service';
import { UPDATE_USER_EXTRA_DATA_METRICS } from '@repo/common-lib/constants/constants';
import { UpdateUserExtraDataMetricsEvent } from '../user-extra-data/events/update-user-extra-data-metrics.event';
import { UpdateMediaRequest } from './requests/update-media.request';
import { RequestService } from 'src/common/services/request.service';
import { DEFAULT_COMPRESSION_LVL } from '@repo/common-lib/constants/enums';
import { MediaModerationException } from 'src/common/exceptions/media-moderation-exception';

@Injectable()
export class MediaService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'media',
  });
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly userService: UserService,
    private readonly requestService: RequestService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly compressService: CompressService,
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
    private readonly helpers: Helpers,
    private readonly eventEmitter: EventEmitter2,
  ) { }
  public async findAll(data: IndexMediaRequest) {
    const result = await this.mediaRepository.getAll(data);
    return await Promise.all(
      result.map(async (media) => {
        if (media.thumbnail) {
          media.thumbnail = await this.helpers.getAsset(media.thumbnail);
        }
        if (media.url) {
          media.url = await this.helpers.getAsset(media.url);
        }
        return media;
      }),
    );
  }
  public async getAsset(id: number) {

    const media = await this.mediaRepository.findById(id);
    if (!media) return null;
    return await this.helpers.getAsset(media.thumbnail)
  }
  public async bulkCreate(data: CreateMediaRequest[]) {
    throw new HttpException('method not implemented yet', 403);

    if (!data.length) throw new BadRequestException('Empty data given');
    const userId = data[0].user_id;
    let totalMediaSize = 0;
    const compressedMedia: {
      filename: string;
      size: number;
      buffer: Buffer;
    }[] = [];

    for (const item of data) {
      if (item.user_id !== userId) {
        throw new BadRequestException('Users must be the same');
      }
      const targetSize = Math.min(item.media.size / 3, mbToBytes(3));
      const mediaCompressed = await this.compressService.optimizeImageToWebp(
        item.media,
        targetSize,
        90,
      );
      totalMediaSize += mediaCompressed.size;
      compressedMedia.push(mediaCompressed);
    }

    await this.userExtraDataService.enforceUserLimits(userId, {
      size: Math.round(bytesToMB(totalMediaSize) * 100) / 100,
      storageRequests: data.length,
    });
  }



  public async create({ media, ...data }: CreateMediaRequest) {
    try {

      // 1. Generate thumbnail first (for moderation check)
      const thumbnail = await this.compressService.optimizeImageToWebp(media, 100 * 1024, 80);

      // 2. Resolve user & paths so we can store the thumbnail
      const [user, mediaPublicId] = await Promise.all([
        this.userService.findOne(data.user_id),
        generateUUID(),
      ]);
      const filename = data.seo_filename || path.parse(media.originalname).name;
      const basePath = `users/${user.public_id}/media/${mediaPublicId}/${filename}`;
      const thumbnailPath = `${basePath}-thumbnail.webp`;

      // 3. Store thumbnail
      const thumbnailFile = { ...media, ...thumbnail };
      await this.storageService.write(thumbnailFile, thumbnailPath);

      // 4. Moderate content using the stored thumbnail
      const thumbnailUrl = await this.helpers.getAsset(thumbnailPath);
      const { moderation } = await this.aiService.moderateContent(thumbnailUrl, {
        user_id: data.user_id,
      });

      // 5. If not allowed → delete thumbnail and throw
      if (!moderation.is_allowed) {
        await this.helpers.deleteAsset(thumbnailPath);
        throw new MediaModerationException(moderation.reason);
      }

      const compressionLevel = data.compression_level || DEFAULT_COMPRESSION_LVL;
      // 6. Compress full media
      const targetSize = Math.round(
        Math.min(
          this.compressService.getSizeCompressed(
            media.size,
            compressionLevel,
            300 * 1024,
          ),
          mbToBytes(5),
        ),
      );
      const mediaCompressed = await this.compressService.optimizeImageToWebp(media, targetSize, 100);

      // 7. Enforce user limits (thumbnail + media)
      const totalSize = mediaCompressed.size + thumbnail.size;
      await this.userExtraDataService.enforceUserLimits(data.user_id, {
        size: Math.round(bytesToMB(totalSize) * 100) / 100,
        enforceCompressionLevel: !!data.compression_level,
      });

      // 8. Store full media
      const mediaPath = `${basePath}.webp`;
      const mediaFile = { ...media, ...mediaCompressed };
      await this.storageService.write(mediaFile, mediaPath);

      // 9. Emit storage request events for each file
      this.eventEmitter.emit(
        CREATE_USER_STORAGE_REQUEST,
        new CreateUserStorageRequestEvent({
          path: mediaPath,
          bytes: mediaCompressed.size,
          user_id: data.user_id,
        }),
      );
      this.eventEmitter.emit(
        CREATE_USER_STORAGE_REQUEST,
        new CreateUserStorageRequestEvent({
          path: thumbnailPath,
          bytes: thumbnail.size,
          user_id: data.user_id,
        }),
      );

      // 10. Create media record
      const defaultSeoText = `${user.username} photo`;
      const mediaData: CreateMediaInput = {
        ...data,
        public_id: mediaPublicId,
        bytes: mediaFile.size,
        thumbnail_bytes: thumbnailFile.size,
        extension: 'webp',
        url: mediaPath,
        thumbnail: thumbnailPath,
        seo_filename: filename,
        blocked: false,
        shape: await this.compressService.getImageShape(mediaFile.buffer),
        is_active: true,
        seo_title: data.seo_title || data.title || defaultSeoText,
        seo_alt: data.seo_alt || data.title || defaultSeoText,
        compression_level: compressionLevel,
        seo_description: data.seo_description || data.description,
      };
      cleanObj(mediaData);

      const result = await this.mediaRepository.create(mediaData);
      this.eventEmitter.emit(UPDATE_USER_EXTRA_DATA_METRICS, new UpdateUserExtraDataMetricsEvent(user.id));
      result.thumbnail = thumbnailUrl;
      return result;
    } catch (error) {
      this.logger.error(
        error instanceof Error
          ? error.message
          : 'Something went wrong creating media',
        error,
      );
      throw error;
    }
  }

  public async delete(id: number): Promise<void> {
    const media = await this.mediaRepository.findById(id);
    if (media.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    await Promise.all([
      this.helpers.deleteAsset(media.thumbnail),
      this.helpers.deleteAsset(media.url),
      this.mediaRepository.deleteById(id)
    ])

    this.eventEmitter.emit(
      UPDATE_USER_EXTRA_DATA_METRICS,
      new UpdateUserExtraDataMetricsEvent(media.user_id),
    );
  }

  public async update(id: number, data: UpdateMediaRequest) {
    cleanObj(data);

    const media = await this.mediaRepository.findById(id);
    if (media.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    // Process assets once and store them
    const processedThumbnail = media.thumbnail
      ? await this.helpers.getAsset(media.thumbnail)
      : media.thumbnail;
    const processedUrl = media.url
      ? await this.helpers.getAsset(media.url)
      : media.url;

    if (!Object.values(data).length) {
      // Return media with processed assets
      media.thumbnail = processedThumbnail;
      media.url = processedUrl;
      return media;
    }

    const result = await this.mediaRepository.updateById(id, data);

    // Reuse the processed assets
    result.thumbnail = processedThumbnail;
    result.url = processedUrl;

    return result;
  }
}
