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
import { QueueHelper } from '@repo/backend-lib/utils';
import { CreateMediaInput, MediaWithUser, UpdateMediaInternalInput } from '@repo/common-lib/types/media';
import { EntitySeoMetadata, MediaSeoTranslation } from '@repo/common-lib/types/ai';
import { cleanObj } from '@repo/common-lib/utils/object';
import { UPDATE_PROFILE_STATUS_EVENT } from '@repo/common-lib/constants/events';
import {
  CACHE_KEY_MEDIA_SEO,
  SEO_METADATA_CACHE_TTL,
} from '@repo/common-lib/constants/cache';
import { IndexMediaRequest } from '../user-media/requests/index-media.request';
import { Helpers } from 'src/common/services/helpers.service';
import { UpdateProfileStatusEvent } from '../profile-status/events/update-profile-status.event';
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
  public async getOneByPublicId(publicId: string) {


    const media = await this.mediaRepository.findOneByColumn('public_id', publicId);

    if (!media) return null;

    const [thumbnail, url, tags] = await Promise.all([
      this.helpers.getAsset(media.thumbnail),
      this.helpers.getAsset(media.url),
      this.mediaRepository.getTagsByMediaId(media.id),
    ]);

    media.thumbnail = thumbnail;
    media.url = url;
    // Localized content tags (LLM-assigned) for JSON-LD keywords + on-page chips.
    (media as MediaWithUser).tags = tags;

    return media;
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



  /** Remove a single trailing file extension while keeping any forward-slash S3 dirs intact. */
  private stripExtension(name: string): string {
    return name.replace(/\.[^./\\]+$/, '');
  }

  /**
   * Storage keys for a media upload. Filename is derived from the upload only
   * (clients cannot set seo_filename; AI may overwrite it later).
   * The per-media `mediaPublicId` folder isolates each media so two uploads (or an AI
   * rename) that resolve to the same filename never collide within the same user.
   */
  private buildMediaStoragePaths(
    userPublicId: string,
    mediaPublicId: string,
    originalName: string,
  ) {
    const filename = this.stripExtension(originalName);
    const basePath = `users/${userPublicId}/media/${mediaPublicId}/${filename}`;
    return {
      filename,
      mediaPath: `${basePath}.webp`,
      thumbnailPath: `${basePath}-thumbnail.webp`,
    };
  }

  public async create({ media, ...data }: CreateMediaRequest) {
    try {

      // 1. Generate thumbnail first (for moderation check)
      const thumbnail = await this.compressService.optimizeImageToWebp(media, 200 * 1024, 90);

      // 2. Resolve user & paths so we can store the thumbnail
      const [user, mediaPublicId] = await Promise.all([
        this.userService.findOne(data.user_id),
        generateUUID(),
      ]);
      const { filename, mediaPath, thumbnailPath } = this.buildMediaStoragePaths(
        user.public_id,
        mediaPublicId,
        media.originalname,
      );

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
      const mediaFile = { ...media, ...mediaCompressed };
      await this.storageService.write(mediaFile, mediaPath);

      // 9. Enqueue storage request jobs for each file
      await QueueHelper.createStorageRequestJob({
        path: mediaPath,
        bytes: mediaCompressed.size,
        user_id: data.user_id,
      });
      await QueueHelper.createStorageRequestJob({
        path: thumbnailPath,
        bytes: thumbnail.size,
        user_id: data.user_id,
      });

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
        blocked_at: null,
        is_featured: false,
        is_value_pillars: false,
        is_highlight: false,
        shape: await this.compressService.getImageShape(mediaFile.buffer),
        aspect_ratio: await this.compressService.getImageAspectRatio(mediaFile.buffer),
        is_active: true,
        seo_title: data.seo_title || data.title || defaultSeoText,
        seo_alt: data.seo_alt || data.title || defaultSeoText,
        compression_level: compressionLevel,
        completed_at: new Date(),
        seo_description: data.seo_description || data.description,
      };
      cleanObj(mediaData);

      const result = await this.mediaRepository.create(mediaData);
      await QueueHelper.createComputeUserMetricsJob(user.id);
      this.eventEmitter.emit(
        UPDATE_PROFILE_STATUS_EVENT,
        new UpdateProfileStatusEvent(user.id, { has_media: true }),
      );
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

  public async createAsync({ media: mediaFile, ...data }: CreateMediaRequest) {
    const log = this.logger.name('create-async');
    log.info('Starting async media create', {
      user_id: data.user_id,
      original_name: mediaFile.originalname,
      size: mediaFile.size,
      mimetype: mediaFile.mimetype,
    });

    const [user, mediaPublicId] = await Promise.all([
      this.userService.findOne(data.user_id),
      generateUUID(),
    ]);

    const { filename, mediaPath, thumbnailPath } = this.buildMediaStoragePaths(
      user.public_id,
      mediaPublicId,
      mediaFile.originalname,
    );
    log.info('Resolved storage paths', {
      user_id: user.id,
      public_id: mediaPublicId,
      media_path: mediaPath,
      thumbnail_path: thumbnailPath,
    });

    const defaultSeoText = `${user.username} photo`;
    const compressionLevel = data.compression_level || DEFAULT_COMPRESSION_LVL;

    // Placeholder row: files are not stored yet. Required columns get defaults;
    // shape / bytes / aspect_ratio are filled in when processing completes.
    const baseMedia: CreateMediaInput = {
      ...data,
      public_id: mediaPublicId,
      bytes: 0,
      thumbnail_bytes: 0,
      extension: 'webp',
      url: mediaPath,
      thumbnail: thumbnailPath,
      seo_filename: filename,
      blocked_at: null,
      is_featured: false,
      is_value_pillars: false,
      is_highlight: false,
      aspect_ratio: '1:1',
      is_active: true,
      seo_title: data.seo_title || data.title || defaultSeoText,
      seo_alt: data.seo_alt || data.title || defaultSeoText,
      compression_level: compressionLevel,
      seo_description: data.seo_description || data.description,
      status: 'UPLOADING',
      completed_at: null,
      failed_reason: null,
    };
    cleanObj(baseMedia);

    let mediaModel = await this.mediaRepository.create(baseMedia);
    log.info('Created placeholder media row', {
      media_id: mediaModel.id,
      public_id: mediaModel.public_id,
      status: mediaModel.status,
    });

    await QueueHelper.createOrUpdateUserNotificationJob({
      type: 'CREATE_UPDATE_MEDIA',
      user_id: mediaModel.user_id,
      entity_id: mediaModel.id,
      read_at: null,
    });
    log.info('Enqueued CREATE_UPDATE_MEDIA notification', {
      media_id: mediaModel.id,
      user_id: mediaModel.user_id,
    });

    let writeOk = false;
    try {
      log.info('Writing original file to storage', {
        media_id: mediaModel.id,
        path: mediaPath,
        size: mediaFile.size,
      });
      writeOk = await this.storageService.write(mediaFile, mediaPath);
      if (!writeOk) {
        log.error('Storage write returned false', {
          media_id: mediaModel.id,
          path: mediaPath,
        });
      }
    } catch (error) {
      log.error(
        `Storage write threw: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }

    if (!writeOk) {
      mediaModel = await this.mediaRepository.updateById(mediaModel.id, {
        ...mediaModel,
        status: 'FAILED',
        failed_reason: 'Storage write could not complete',
      });
      log.error('Marked media as FAILED after storage write', {
        media_id: mediaModel.id,
        public_id: mediaModel.public_id,
        failed_reason: mediaModel.failed_reason,
      });
      await QueueHelper.createOrUpdateUserNotificationJob({
        type: 'CREATE_UPDATE_MEDIA',
        user_id: mediaModel.user_id,
        entity_id: mediaModel.id,
        read_at: null,
      });
      return mediaModel;
    }

    await QueueHelper.createProcessMediaJob(mediaModel);
    log.info('Enqueued process-media job', {
      media_id: mediaModel.id,
      public_id: mediaModel.public_id,
      path: mediaPath,
    });
    return mediaModel;
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

    await QueueHelper.createComputeUserMetricsJob(media.user_id);
    const stillHasMedia = await this.mediaRepository.exists({
      user_id: media.user_id,
    });
    this.eventEmitter.emit(
      UPDATE_PROFILE_STATUS_EVENT,
      new UpdateProfileStatusEvent(media.user_id, {
        has_media: stillHasMedia,
      }),
    );
  }

  public async update(
    id: number,
    data: UpdateMediaRequest & Pick<UpdateMediaInternalInput, 'seo_filename' | 'seo_generated_at'>,
  ) {
    cleanObj(data);

    const media = await this.mediaRepository.findById(id);
    if (media.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    const internalData: UpdateMediaInternalInput = { ...data };

    // On the FIRST SEO generation, rename the stored objects so their S3 keys become keyword-rich.
    // Both the media file and its thumbnail are moved so they stay aligned (as `create` produces them).
    if (data.seo_filename && !media.seo_generated_at && media.url) {
      const newFilename = this.stripExtension(data.seo_filename);
      const dir = media.url.slice(0, media.url.lastIndexOf('/'));
      const currentFilename = this.stripExtension(media.url.slice(dir.length + 1));
      if (newFilename && newFilename !== currentFilename) {
        const newUrl = `${dir}/${newFilename}.webp`;
        const newThumbnail = media.thumbnail ? `${dir}/${newFilename}-thumbnail.webp` : media.thumbnail;
        await Promise.all([
          this.helpers.moveAsset(media.url, newUrl),
          media.thumbnail && newThumbnail
            ? this.helpers.moveAsset(media.thumbnail, newThumbnail)
            : Promise.resolve(),
        ]);
        media.url = newUrl;
        internalData.url = newUrl;
        internalData.seo_filename = newFilename;
        if (media.thumbnail && newThumbnail) {
          media.thumbnail = newThumbnail;
          internalData.thumbnail = newThumbnail;
        }
      }
    }

    // Process assets once and store them (using the possibly-renamed key)
    const processedThumbnail = media.thumbnail
      ? await this.helpers.getAsset(media.thumbnail)
      : media.thumbnail;
    const processedUrl = media.url
      ? await this.helpers.getAsset(media.url)
      : media.url;

    if (!Object.values(internalData).length) {
      // Return media with processed assets
      media.thumbnail = processedThumbnail;
      media.url = processedUrl;
      return media;
    }

    const result = await this.mediaRepository.updateById(id, internalData);

    // Reuse the processed assets
    result.thumbnail = processedThumbnail;
    result.url = processedUrl;

    // SEO (title/description/alt/blocked/active) may have changed → drop the cached metadata.
    await this.invalidateSeoCache(media.public_id);

    return result;
  }

  /** Clear the cached SEO metadata for a media (all locales). */
  public async invalidateSeoCache(publicId: string) {
    await this.helpers.deleteCached(CACHE_KEY_MEDIA_SEO(publicId), {
      appended_language: true,
    });
  }

  /**
   * Replace the media's category tags with `categoryIds` (media_categories pivot).
   * Ownership-checked like {@link update}. A no-op (returns early) when the list is empty so an
   * empty AI result does not wipe existing tags.
   */
  public async attachCategories(id: number, categoryIds: number[]) {
    if (!categoryIds.length) return;

    const media = await this.mediaRepository.findById(id);
    if (media.user_id !== this.requestService.user.id) {
      throw new UnauthorizedException();
    }

    return this.mediaRepository.attach('media_categories', {
      modelCol: 'media_id',
      modelValue: id,
      attachCol: 'category_id',
      valuesToAttach: categoryIds,
      removePrevious: true,
    });
  }

  /**
   * Persist per-locale media SEO (media_translations). Called right after {@link update}, which
   * already ownership-checks the media, so no extra check here. No-op on an empty list.
   */
  public async upsertSeoTranslations(id: number, rows: MediaSeoTranslation[]) {
    if (!rows.length) return;
    return this.mediaRepository.upsertSeoTranslations(id, rows);
  }

  /**
   * Lean, locale-resolved SEO for `generateMetadata` on the media detail page.
   * Cached per (publicId, language); invalidated on media update.
   */
  public async getSeoMetadata(publicId: string): Promise<EntitySeoMetadata | null> {
    // Cache the thumbnail PATH (stable); sign `og_image` fresh per request (presigned URL expires ~1h).
    const cached = await this.helpers.cacheRemember(
      CACHE_KEY_MEDIA_SEO(publicId),
      async () => {
        const meta = await this.mediaRepository.getSeoMetadataByPublicId(publicId);
        if (!meta) return null;
        return {
          seo_title: meta.seo_title,
          seo_description: meta.seo_description,
          thumbnail_path: meta.thumbnail,
          canonical_path: `/artists/${meta.username}/media/${publicId}`,
          noindex: meta.blocked || !meta.is_active,
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
}
