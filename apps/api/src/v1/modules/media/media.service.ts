import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MediaRepository } from './media.repository';
import { CreateMediaRequest } from './requests/create-media.request';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import {
  CompressService,
  THUMBNAIL_MAX_EDGE_PX,
  THUMBNAIL_TARGET_BYTES,
} from '@repo/backend-lib/services/compress-service/base';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { UserService } from '../users/users.service';
import { AiService } from '@repo/backend-lib/services/ai-service';
import { generateUUID } from '@repo/common-lib/utils/generate-uuid';
import { bytesToMB, mbToBytes } from '@repo/common-lib/utils/bytes';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import { CreateMediaInput, Media, MediaWithUser, UpdateMediaInternalInput } from '@repo/common-lib/types/media';
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
import { MediaHelper } from '@repo/common-lib/utils/media';
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
    const [thumbnail, url] = await Promise.all([this.helpers.getAsset(media.thumbnail), this.helpers.getAsset(media.url)])
    return {
      thumbnail,
      url,
      media_type: media.media_type,
    }
  }

  /** Remove a single trailing file extension while keeping any forward-slash S3 dirs intact. */
  private stripExtension(name: string): string {
    return name.replace(/\.[^./\\]+$/, '');
  }

  /**
   * Storage keys for a media upload. Filename is derived from the upload only
   * (clients cannot set seo_filename; AI may overwrite it later) and is slugified, because the
   * key is interpolated straight into a CDN URL.
   * The per-media `mediaPublicId` folder isolates each media so two uploads (or an AI
   * rename) that resolve to the same filename never collide within the same user.
   * GIFs keep `.gif` so S3 ContentType matches the bytes; still images are stored as WebP;
   * videos are transcoded to `.mp4`.
   * The thumbnail is always WebP whatever the media is — see {@link MediaHelper.thumbnailPath}.
   *
   * `sourcePath` is where the untouched upload goes. It equals `mediaPath` for images and GIFs
   * (the worker overwrites it in place seconds later), but a video needs its own key: the
   * upload is a `.mov`/`.mpeg` while the output is `.mp4`, and S3 derives ContentType from the
   * key — so storing one under the other's extension would serve a lie.
   */
  private buildMediaStoragePaths(
    userPublicId: string,
    mediaPublicId: string,
    originalName: string,
    mediaType: Media['media_type'],
  ) {
    const filename = MediaHelper.storageFilename(
      this.stripExtension(originalName),
      mediaPublicId,
    );
    const extension = MediaHelper.outputExtension(mediaType);
    const mediaPath = `users/${userPublicId}/media/${mediaPublicId}/${filename}.${extension}`;
    const sourceExtension = this.extractExtension(originalName);
    return {
      filename,
      extension,
      mediaPath,
      sourcePath:
        mediaType === 'VIDEO' && sourceExtension
          ? MediaHelper.sourcePath(mediaPath, sourceExtension)
          : mediaPath,
      thumbnailPath: MediaHelper.thumbnailPath(mediaPath),
    };
  }

  /** Counterpart to {@link stripExtension}: the extension alone, lowercased, without the dot. */
  private extractExtension(name: string): string {
    return name.match(/\.([^./\\]+)$/)?.[1]?.toLowerCase() ?? '';
  }

  private optimizeUpload(
    file: Express.Multer.File,
    targetSize: number,
    quality: number,
    mediaType: Media['media_type'],
  ) {
    if (mediaType === 'VIDEO') {
      return this.compressService.optimizeVideo(file, targetSize, quality);
    }
    if (mediaType === 'GIF') {
      return this.compressService.optimizeGif(file, targetSize, quality);
    }
    return this.compressService.optimizeImageToWebp(file, targetSize, quality);
  }

  /**
   * The listing-sized static WebP for an upload. Video needs ffmpeg to reach a decodable frame
   * at all — `optimizeImageToWebp` would hand a non-`image/*` multer file straight back
   * unmodified, i.e. store the raw MP4 under the thumbnail's `.webp` key.
   */
  private buildThumbnail(
    file: Express.Multer.File,
    mediaType: Media['media_type'],
  ) {
    if (mediaType === 'VIDEO') {
      return this.compressService.optimizeVideoFrameToWebp(
        file,
        THUMBNAIL_TARGET_BYTES,
        80,
        THUMBNAIL_MAX_EDGE_PX,
      );
    }
    return this.compressService.optimizeImageToWebp(
      file,
      THUMBNAIL_TARGET_BYTES,
      80,
      THUMBNAIL_MAX_EDGE_PX,
    );
  }

  private async notifyMediaUpdate(media: Pick<Media, 'id' | 'user_id'>): Promise<void> {
    await QueueHelper.createOrUpdateUserNotificationJob({
      type: 'CREATE_UPDATE_MEDIA',
      user_id: media.user_id,
      entity_id: media.id,
      read_at: null,
    });
  }

  /** Never throws — safe to call from fire-and-forget work. */
  private async markCreateFailed(
    media: Pick<Media, 'id' | 'user_id' | 'public_id'>,
    reason: string,
  ): Promise<void> {
    const log = this.logger.name('create');
    try {
      await this.mediaRepository.updateById(media.id, {
        status: 'FAILED',
        failed_reason: reason,
      });
      await this.notifyMediaUpdate(media);
      log.error('Marked media as FAILED after storage write', {
        media_id: media.id,
        public_id: media.public_id,
        failed_reason: reason,
      });
    } catch (error) {
      log.error(
        `Could not mark media as FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  /** Storage write + process-media enqueue. Do not await from createAsync. */
  private async writeOriginalAndEnqueue({
    media,
    file,
    userPublicId,
    generate_metadata,
  }: {
    media: Media;
    file: Express.Multer.File;
    userPublicId: string;
    generate_metadata?: boolean;
  }): Promise<void> {
    const log = this.logger.name('create');
    try {
      const mediaType =
        media.media_type ??
        MediaHelper.getMediaTypeFromMimeType(file.mimetype) ??
        'IMAGE';
      const { extension, sourcePath } = this.buildMediaStoragePaths(
        userPublicId,
        media.public_id,
        file.originalname,
        mediaType,
      );
      log.info('Writing original file to storage', {
        media_id: media.id,
        path: sourcePath,
        size: file.size,
      });
      const writeOk = await this.storageService.write(file, sourcePath);
      if (!writeOk) {
        log.error('Storage write returned false', {
          media_id: media.id,
          path: sourcePath,
        });
        await this.markCreateFailed(media, 'Storage write could not complete');
        return;
      }

      // Persist the storage key only after the object exists. Do not spread the
      // placeholder row: `extension` is varchar(5), and the job must see `url`.
      //
      // `url` is the SOURCE key at this point, not the final one — for video the two differ,
      // and the worker rewrites the row with the processed key once the transcode lands. The
      // media is still `UPLOADING`, so nothing renders it in the meantime.
      const stored = await this.mediaRepository.updateById(media.id, {
        url: sourcePath,
        extension,
      });
      await this.notifyMediaUpdate(stored);
      await QueueHelper.createProcessMediaJob({
        media: stored,
        generate_metadata,
      });
      log.info('Enqueued process-media job', {
        media_id: media.id,
        public_id: media.public_id,
        path: sourcePath,
      });
    } catch (error) {
      log.error(
        `Storage write threw: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      await this.markCreateFailed(media, 'Something went wrong during creation');
    }
  }

  public async create({ media, ...data }: CreateMediaRequest) {
    try {
      const mediaType = MediaHelper.getMediaTypeFromMimeType(media.mimetype) ?? 'IMAGE';

      // 1. Generate thumbnail first (for moderation check). Always WebP, and always the
      // listing-sized raster — for a GIF this is the static poster frame, and for a video the
      // extracted poster frame, which is also the only thing the vision model can moderate.
      const thumbnail = await this.buildThumbnail(media, mediaType);

      // 2. Resolve user & paths so we can store the thumbnail
      const [user, mediaPublicId] = await Promise.all([
        this.userService.findOne(data.user_id),
        generateUUID(),
      ]);
      const { filename, extension, mediaPath, thumbnailPath } = this.buildMediaStoragePaths(
        user.public_id,
        mediaPublicId,
        media.originalname,
        mediaType,
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
      const targetSize = this.compressService.getSizeCompressed({
        size: media.size,
        compressLevel: compressionLevel,
        minSize: 300 * 1024,
        maxSize: mbToBytes(5),
      });
      const mediaCompressed = await this.optimizeUpload(media, targetSize, 100, mediaType);

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
        extension,
        url: mediaPath,
        thumbnail: thumbnailPath,
        seo_filename: filename,
        blocked_at: null,
        is_featured: false,
        is_value_pillars: false,
        is_highlight: false,
        // Derived from the thumbnail, not the media: for video the stored asset is an MP4 that
        // `image-size` cannot read, and for images the two agree to well within one aspect
        // bucket (the thumbnail is a `fit: 'inside'` downscale of the same frame).
        shape: await this.compressService.getImageShape(thumbnailFile.buffer),
        aspect_ratio: await this.compressService.getImageAspectRatio(thumbnailFile.buffer),
        media_type: mediaType,
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

  public async createAsync({ media: mediaFile, generate_metadata, ...data }: CreateMediaRequest) {
    const log = this.logger.name('create');
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

    const mediaType = MediaHelper.getMediaTypeFromMimeType(mediaFile.mimetype) ?? 'IMAGE';
    // Same slug the storage key will use, so `seo_filename` and the stored object stay aligned.
    const filename = MediaHelper.storageFilename(
      this.stripExtension(mediaFile.originalname),
      mediaPublicId,
    );
    const defaultSeoText = `${user.username} photo`;
    const compressionLevel = data.compression_level || DEFAULT_COMPRESSION_LVL;

    // Placeholder row: files are not stored yet. Required columns get defaults;
    // shape / bytes / aspect_ratio are filled in when processing completes.
    const baseMedia: CreateMediaInput = {
      ...data,
      public_id: mediaPublicId,
      bytes: 0,
      thumbnail_bytes: 0,
      extension: null,
      url: null,
      seo_filename: filename,
      blocked_at: null,
      is_featured: false,
      is_value_pillars: false,
      is_highlight: false,
      aspect_ratio: '1:1',
      media_type: mediaType,
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

    const mediaModel = await this.mediaRepository.create(baseMedia);
    log.info('Created placeholder media row', {
      media_id: mediaModel.id,
      public_id: mediaModel.public_id,
      status: mediaModel.status,
    });

    await this.notifyMediaUpdate(mediaModel);
    log.info('Enqueued CREATE_UPDATE_MEDIA notification', {
      media_id: mediaModel.id,
      user_id: mediaModel.user_id,
    });

    void this.writeOriginalAndEnqueue({
      media: mediaModel,
      file: mediaFile,
      userPublicId: user.public_id,
      generate_metadata,
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

    await QueueHelper.createOrUpdateUserNotificationJob({
      type: 'DELETE_MEDIA',
      user_id: media.user_id,
      entity_id: media.id,
      read_at: null,
    });

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
    return this.updateForUser(id, this.requestService.user.id, data);
  }

  public async updateForUser(
    id: number,
    userId: number,
    data: UpdateMediaRequest & Pick<UpdateMediaInternalInput, 'seo_filename' | 'seo_generated_at'>,
  ) {
    cleanObj(data);

    const media = await this.mediaRepository.findById(id);
    if (media.user_id !== userId) {
      throw new UnauthorizedException();
    }

    const internalData: UpdateMediaInternalInput = { ...data };

    // On the FIRST SEO generation, rename the stored objects so their S3 keys become keyword-rich.
    // Both the media file and its thumbnail are moved so they stay aligned (as `create` produces them).
    if (data.seo_filename && !media.seo_generated_at && media.url) {
      // Slugified like an upload: the prompt asks the model for a URL-safe filename but nothing
      // makes it comply, and this value goes straight into an S3 key.
      const newFilename = MediaHelper.storageFilename(
        this.stripExtension(data.seo_filename),
        media.public_id,
      );
      const dir = media.url.slice(0, media.url.lastIndexOf('/'));
      const currentFilename = this.stripExtension(media.url.slice(dir.length + 1));
      if (newFilename && newFilename !== currentFilename) {
        const extension = media.extension || MediaHelper.outputExtension(media.media_type);
        const newUrl = `${dir}/${newFilename}.${extension}`;
        // Rename only — the object is moved, not re-encoded, so it keeps whatever format it was
        // written in. Rows created before thumbnails were standardised on WebP may still hold a
        // `.gif` thumbnail, and moving that under a `.webp` key would mislabel its ContentType.
        const newThumbnail = media.thumbnail
          ? MediaHelper.withExtension(
            MediaHelper.thumbnailPath(newUrl),
            media.thumbnail.split('.').pop() || 'webp',
          )
          : media.thumbnail;
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

  public async updateAsync(id: number, data: UpdateMediaRequest) {
    const userId = this.requestService.user.id;
    const media = await this.mediaRepository.findById(id);

    if (!media || media.user_id !== userId) {
      throw new UnauthorizedException();
    }

    await this.mediaRepository.updateById(id, { status: 'UPDATING' });

    const updatingMedia: Media = { ...media, status: 'UPDATING' };
    await this.notifyMediaUpdate(updatingMedia);

    try {
      await QueueHelper.createUpdateMediaJob({
        media_id: id,
        user_id: userId,
        data,
      });

      this.logger.info(`Update media job enqueued: media [${id}]`, {
        media_id: id,
        user_id: userId,
      });

      return updatingMedia;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      if (
        lower.includes('job') &&
        (lower.includes('already') || lower.includes('exists') || lower.includes('exist'))
      ) {
        this.logger.info(`Update media job already queued (skipped): media [${id}]`);
        return updatingMedia;
      }
      throw error;
    }
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
    return this.attachCategoriesForUser(id, this.requestService.user.id, categoryIds);
  }

  public async attachCategoriesForUser(
    id: number,
    userId: number,
    categoryIds: number[],
  ) {
    if (!categoryIds.length) return;

    const media = await this.mediaRepository.findById(id);
    if (media.user_id !== userId) {
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
