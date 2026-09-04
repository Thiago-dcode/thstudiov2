import { JOB_PROCESS_MEDIA } from "@repo/common-lib/constants/queues";
import { Job } from "bullmq";
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import { compressConfig, s3StorageConfig } from "@repo/backend-lib/config/storage";
import { AiService } from "@repo/backend-lib/services/ai-service";
import { FactoryLLMService } from "@repo/backend-lib/services/llm-service/factory";
import { openAiLLMConfig } from "@repo/backend-lib/config/llm";
import { FactoryLogService, LogService } from "@repo/backend-lib/services/log-service";
import {
    compressionLevelToQuality,
    CompressService,
    THUMBNAIL_MAX_EDGE_PX,
    THUMBNAIL_TARGET_BYTES,
} from '@repo/backend-lib/services/compress-service/base';
import {
    CompressionOutput,
    VideoCompressionOutput,
} from '@repo/backend-lib/services/compress-service/types';
import { ContentModerationFields } from '@repo/common-lib/types/ai';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { Media, MediaJobDto } from "@repo/common-lib/types/media";
import { MediaRepository } from "@repo/database/repositories/media";
import { UserExtraDataRepository } from "@repo/database/repositories/user-extra-data";
import { PlansRepository } from "@repo/database/repositories/plans";
import { QueueHelper } from "@repo/backend-lib/utils";
import { bytesToMB, mbToBytes } from "@repo/common-lib/utils/bytes";
import { DEFAULT_COMPRESSION_LVL } from "@repo/common-lib/constants/enums";
import { UserLimits } from "@repo/common-lib/utils/user-limits";
import { BasePlan } from "@repo/common-lib/types/plan";
import { MediaHelper } from "@repo/common-lib/utils/media";

export class MediaProcessor {
    constructor(
        private readonly job: Job,
        private readonly storageService: StorageService,
        private readonly compressService: CompressService,
        private readonly aiService: AiService,
        private readonly mediaRepository: MediaRepository,
        private readonly userExtraDataRepository: UserExtraDataRepository,
        private readonly plansRepository: PlansRepository,
        private readonly logger: LogService,
    ) { }

    static async handle(job: Job): Promise<void> {
        const logger = FactoryLogService.createLogService('file', { channel: 'media' });
        const instance = new MediaProcessor(
            job,
            FactoryStorageService.create(s3StorageConfig),
            FactoryCompressService.create(compressConfig),
            AiService.instance(FactoryLLMService.create(openAiLLMConfig)),
            MediaRepository.instance(),
            UserExtraDataRepository.instance(),
            PlansRepository.instance(),
            logger,
        );
        try {
            switch (job.name) {
                case JOB_PROCESS_MEDIA:
                    return await instance.processMedia();

                default:
                    throw new Error(`Job name "${job.name}" not recognized`);
            }
        } finally {
            await instance.logger.flushAsync();
        }
    }

    private async notifyMediaUpdate(data: Pick<Media, 'id' | 'user_id'>) {
        await QueueHelper.createOrUpdateUserNotificationJob({
            type: 'CREATE_UPDATE_MEDIA',
            user_id: data.user_id,
            entity_id: data.id,
            read_at: null,
        });
    }

    private async markFailed(
        data: Media,
        reason: string,
        log: ReturnType<LogService['name']>,
        options?: { deletePaths?: string[] },
    ) {
        await this.mediaRepository.updateById(data.id, {
            status: 'FAILED',
            failed_reason: reason,
        });
        if (options?.deletePaths?.length) {
            await Promise.all(
                options.deletePaths.map((path) => this.storageService.delete(path)),
            );
        }
        await this.notifyMediaUpdate(data);
        log.error('Media processing failed', {
            media_id: data.id,
            public_id: data.public_id,
            failed_reason: reason,
        });
    }

    private async resolveUserPlan(userId: number): Promise<BasePlan> {
        const activePlan = await this.plansRepository.findUserActivePlan(userId);
        if (activePlan) return activePlan;
        return this.plansRepository.findFreePlan();
    }

    /** Returns a user-facing failure reason, or null when within limits. */
    private async checkUserLimits(
        userId: number,
        totalSizeBytes: number,
        enforceCompressionLevel: boolean,
    ): Promise<string | null> {
        const [userExtraData, userPlan] = await Promise.all([
            this.userExtraDataRepository.findByUserId(userId),
            this.resolveUserPlan(userId),
        ]);

        const sizeMb = Math.round(bytesToMB(totalSizeBytes) * 100) / 100;

        if (
            !UserLimits.storageSize({
                userExtraData,
                userPlan,
                incomingSize: sizeMb,
            })
        ) {
            return `Media size limit exceeded. Current: ${userExtraData.storage_used_mb}MB, Adding: ${sizeMb}MB, Max allowed: ${userPlan.storage_limit_mb}MB`;
        }

        if (
            enforceCompressionLevel &&
            !UserLimits.mediaCompression({ userPlan })
        ) {
            return `Media compression not allowed with plan: ${userPlan.name}`;
        }

        return null;
    }

    private optimize(
        mediaType: Media['media_type'],
        buffer: Buffer,
        targetSize: number,
        compressLevel: NonNullable<Media['compression_level']>,
    ): Promise<CompressionOutput | VideoCompressionOutput> {
        if (mediaType === 'VIDEO') {
            // The only branch that gets a real quality argument. Sharp's loops express the
            // compression level purely as a byte target and refine toward it in five cheap
            // passes; a video encode costs minutes, so the level has to reach libx264 as its
            // actual quality knob (CRF) on the first attempt.
            return this.compressService.optimizeVideo(
                buffer,
                targetSize,
                compressionLevelToQuality(compressLevel),
            );
        }
        if (mediaType === 'GIF') {
            return this.compressService.optimizeGif(buffer, targetSize, 100);
        }
        return this.compressService.optimizeImageToWebp(buffer, targetSize, 100);
    }

    /**
     * Byte target for the compressor.
     *
     * Video gets no `maxSize`: `mbToBytes(5)` is a display-asset cap and is roughly twenty
     * seconds of 1080p, so every real upload blows past it and a refine loop chasing it would
     * grind good footage into mush. A video's budget is bitrate × duration, which
     * `optimizeVideo` derives internally from the source resolution. The floor rises to 2MB
     * for the same reason — under that an MP4 is either very short or already squeezed.
     */
    private resolveTargetSize(
        mediaType: Media['media_type'],
        size: number,
        compressLevel: NonNullable<Media['compression_level']>,
    ): number {
        if (mediaType === 'VIDEO') {
            return this.compressService.getSizeCompressed({
                size,
                compressLevel,
                minSize: mbToBytes(2),
            });
        }
        return this.compressService.getSizeCompressed({
            size,
            compressLevel,
            minSize: 300 * 1024,
            maxSize: mbToBytes(5),
        });
    }

    /**
     * Produces the thumbnail and the moderation verdict in the order the media type requires.
     *
     * For video the poster has to be extracted AND uploaded first: moderation is a vision call
     * over a URL (`image_url`) and cannot read an MP4, so the poster is what gets judged.
     * Judging before the transcode is also what makes a rejection cheap — banned content never
     * reaches ffmpeg. The trade is that a rejected video leaves a poster in the bucket, which
     * is why the caller deletes it alongside the source.
     *
     * Images and GIFs keep the original order: the stored upload is already something the
     * vision model can read, so there is nothing to gain from writing the thumbnail first.
     */
    private async buildThumbnailAndModerate(
        media: Media,
        buffer: Buffer,
        sourcePath: string,
        thumbnailPath: string,
    ): Promise<{
        thumbnail: CompressionOutput;
        moderation: ContentModerationFields;
        /** True when the thumbnail is already in storage, so the caller must not rewrite it. */
        thumbnailWritten: boolean;
    } | null> {
        if (media.media_type === 'VIDEO') {
            const thumbnail = await this.compressService.optimizeVideoFrameToWebp(
                buffer,
                THUMBNAIL_TARGET_BYTES,
                80,
                THUMBNAIL_MAX_EDGE_PX,
            );
            if (!(await this.storageService.write(thumbnail.buffer, thumbnailPath))) {
                return null;
            }
            const { moderation } = await this.aiService.moderateContent(
                await this.storageService.getUrl(thumbnailPath),
                { user_id: media.user_id },
            );
            return { thumbnail, moderation, thumbnailWritten: true };
        }

        const { moderation } = await this.aiService.moderateContent(
            await this.storageService.getUrl(sourcePath),
            { user_id: media.user_id },
        );

        // Always a static WebP, whatever the media is. A GIF thumbnail would be a second
        // animated GIF — megabytes per grid tile, for a poster frame that costs ~20KB here.
        const thumbnail = await this.compressService.optimizeImageToWebp(
            buffer,
            THUMBNAIL_TARGET_BYTES,
            80,
            THUMBNAIL_MAX_EDGE_PX,
        );
        return { thumbnail, moderation, thumbnailWritten: false };
    }

    async processMedia() {
        const log = this.logger.name('create');
        const { media, generate_metadata }: MediaJobDto = this.job.data;
        const extension = MediaHelper.outputExtension(media.media_type);
        const sourcePath = media.url;
        if (!sourcePath) {
            await this.markFailed(media, 'Media has no storage path', log);
            return;
        }
        const mediaPath = MediaHelper.outputPath(sourcePath, extension);
        const thumbnailPath = MediaHelper.thumbnailPath(mediaPath);
        const deletePaths = [...new Set([sourcePath, mediaPath, thumbnailPath])];

        try {
            log.info('Process media job', {
                media_id: media.id,
                public_id: media.public_id,
                user_id: media.user_id,
                status: media.status,
                media_type: media.media_type,
            });

            const buffer = await this.storageService.getBuffer(sourcePath);

            const prepared = await this.buildThumbnailAndModerate(
                media,
                buffer,
                sourcePath,
                thumbnailPath,
            );
            if (!prepared) {
                await this.markFailed(media, 'Storage write could not complete', log, {
                    deletePaths,
                });
                return;
            }
            const { thumbnail, moderation, thumbnailWritten } = prepared;

            log.info('Moderation result', {
                media_id: media.id,
                public_id: media.public_id,
                is_allowed: moderation.is_allowed,
                severity: moderation.severity,
                // Video is judged on its poster frame, not on the video itself.
                moderated_path: thumbnailWritten ? thumbnailPath : sourcePath,
            });

            if (!moderation.is_allowed) {
                await this.markFailed(media, moderation.reason, log, {
                    // The poster is already in the bucket for video, so it has to go too —
                    // otherwise a rejected upload leaves an orphan nothing will ever clean up.
                    deletePaths: thumbnailWritten
                        ? [sourcePath, thumbnailPath]
                        : [sourcePath],
                });
                return;
            }

            log.info('Thumbnail compressed', {
                media_id: media.id,
                thumbnail_bytes: thumbnail.size,
            });

            log.info('Starting compression', {
                media_id: media.id,
                compression_level: media.compression_level,
                media_type: media.media_type,
                driver: this.compressService.config.driver,
            });

            const compressionLevel = media.compression_level || DEFAULT_COMPRESSION_LVL;
            const targetSize = this.resolveTargetSize(
                media.media_type,
                buffer.length,
                compressionLevel,
            );
            const mediaCompressed = await this.optimize(
                media.media_type,
                buffer,
                targetSize,
                compressionLevel,
            );
            log.info('Media compressed', {
                media_id: media.id,
                media_bytes: mediaCompressed.size,
                target_size: targetSize,
                // Only meaningful for video. `reencoded: false` means the skip heuristic fired
                // and the user's already-compressed file was passed through — without this in
                // the log there is no way to tell whether that is working in production.
                ...('reencoded' in mediaCompressed
                    ? {
                        reencoded: mediaCompressed.reencoded,
                        duration_seconds: Math.round(mediaCompressed.durationSeconds),
                        bit_rate: mediaCompressed.bitRate,
                        source_bytes: buffer.length,
                    }
                    : {}),
            });
            if (mediaCompressed.size > targetSize) {
                // Not a failure — the encoder gave what it could. Worth surfacing because the
                // difference is charged against the user's storage quota below.
                log.warn('Compressed media is still above its target size', {
                    media_id: media.id,
                    media_type: media.media_type,
                    media_bytes: mediaCompressed.size,
                    target_size: targetSize,
                });
            }

            const totalSize = mediaCompressed.size + thumbnail.size;
            const limitReason = await this.checkUserLimits(
                media.user_id,
                totalSize,
                false,
            );
            if (limitReason) {
                await this.markFailed(media, limitReason, log, {
                    deletePaths: thumbnailWritten
                        ? [sourcePath, thumbnailPath]
                        : [sourcePath],
                });
                return;
            }

            const [thumbnailWriteOk, mediaWriteOk] = await Promise.all([
                // Video's poster went up before moderation so the vision model could read it;
                // re-uploading identical bytes would just be a second PUT.
                thumbnailWritten
                    ? Promise.resolve(true)
                    : this.storageService.write(thumbnail.buffer, thumbnailPath),
                this.storageService.write(mediaCompressed.buffer, mediaPath),
            ]);

            if (!thumbnailWriteOk || !mediaWriteOk) {
                await this.markFailed(media, 'Storage write could not complete', log, {
                    deletePaths,
                });
                return;
            }

            if (sourcePath !== mediaPath) {
                await this.storageService.delete(sourcePath);
            }

            // Derived from the THUMBNAIL rather than the media itself. For video that is the
            // only option — `image-size` cannot read an MP4 — and for images it is equivalent:
            // the thumbnail is produced with `fit: 'inside'`, whose aspect error at 800px is
            // under 0.2%, while `resolveAspectRatio` buckets are ~22% apart at their closest.
            // One code path beats a media-type branch that can only ever agree with itself.
            const [shape, aspect_ratio] = await Promise.all([
                this.compressService.getImageShape(thumbnail.buffer),
                this.compressService.getImageAspectRatio(thumbnail.buffer),
            ]);

            // Kept: `media` is the snapshot the job was queued with (still `UPLOADING`,
            // `completed_at: null`), so anything asking "is this media done?" has to read the row
            // this write returns, not the payload.
            const completedMedia = await this.mediaRepository.updateById(media.id, {
                bytes: mediaCompressed.size,
                thumbnail_bytes: thumbnail.size,
                thumbnail: thumbnailPath,
                url: mediaPath,
                extension,
                shape,
                aspect_ratio,
                status: 'COMPLETED',
                completed_at: new Date(),
                failed_reason: null,
            });

            await Promise.all([
                QueueHelper.createStorageRequestJob({
                    path: mediaPath,
                    bytes: mediaCompressed.size,
                    user_id: media.user_id,
                }),
                QueueHelper.createStorageRequestJob({
                    path: thumbnailPath,
                    bytes: thumbnail.size,
                    user_id: media.user_id,
                }),
                QueueHelper.createComputeUserMetricsJob(media.user_id),
                QueueHelper.createUpdateProfileStatusJob({
                    user_id: media.user_id,
                    fields: { has_media: true },
                }),
                this.notifyMediaUpdate(media),
            ]);

            log.info('Media processing completed', {
                media_id: media.id,
                public_id: media.public_id,
                bytes: mediaCompressed.size,
                thumbnail_bytes: thumbnail.size,
                thumbnail_path: thumbnailPath,
                media_path: mediaPath,
            });

            if (generate_metadata) {

                log.info('Generating metadata after media process', {
                    media_id: media.id,
                    user_id: media.user_id,
                });
                if (!MediaHelper.isCompleted(completedMedia)) {
                    log.info(
                        `Skipping generate media metadata: media [${media.id}] not eligible`,
                        {
                            media_id: media.id,
                            status: completedMedia?.status,
                            completed_at: completedMedia?.completed_at,
                            blocked_at: completedMedia?.blocked_at,
                        },
                    );

                } else {
                    await QueueHelper.createGenerateMediaMetadataAndNotifyJob({
                        media_id: media.id,
                        user_id: media.user_id
                    })
                }
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Media processing failed';
            log.error(message, error);
            await this.markFailed(media, message, log, {
                deletePaths,
            });
        }
    }
}
