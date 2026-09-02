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
    CompressService,
    THUMBNAIL_MAX_EDGE_PX,
    THUMBNAIL_TARGET_BYTES,
} from '@repo/backend-lib/services/compress-service/base';
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
        quality: number,
    ) {
        if (mediaType === 'GIF') {
            return this.compressService.optimizeGif(buffer, targetSize, quality);
        }
        return this.compressService.optimizeImageToWebp(buffer, targetSize, quality);
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
        const mediaPath = MediaHelper.withExtension(sourcePath, extension);
        const thumbnailPath = MediaHelper.thumbnailPath(mediaPath);
        const deletePaths = [...new Set([sourcePath, mediaPath, thumbnailPath])];

        try {
            log.info('Process media job', {
                media_id: media.id,
                public_id: media.public_id,
                user_id: media.user_id,
                status: media.status,
            });

            const url = await this.storageService.getUrl(media.url);
            const { moderation } = await this.aiService.moderateContent(url, {
                user_id: media.user_id,
            });

            log.info('Moderation result', {
                media_id: media.id,
                public_id: media.public_id,
                is_allowed: moderation.is_allowed,
                severity: moderation.severity,
            });

            if (!moderation.is_allowed) {
                await this.markFailed(media, moderation.reason, log, {
                    deletePaths: [media.url],
                });
                return;
            }

            log.info('Starting compression', {
                media_id: media.id,
                compression_level: media.compression_level,
                media_type: media.media_type,
                driver: this.compressService.config.driver,
            });

            const buffer = await this.storageService.getBuffer(sourcePath);

            // Always a static WebP, whatever the media is. A GIF thumbnail would be a second
            // animated GIF — megabytes per grid tile, for a poster frame that costs ~20KB here.
            const thumbnail = await this.compressService.optimizeImageToWebp(
                buffer,
                THUMBNAIL_TARGET_BYTES,
                80,
                THUMBNAIL_MAX_EDGE_PX,
            );
            log.info('Thumbnail compressed', {
                media_id: media.id,
                thumbnail_bytes: thumbnail.size,
            });

            const compressionLevel = media.compression_level || DEFAULT_COMPRESSION_LVL;
            const targetSize = this.compressService.getSizeCompressed({
                size: buffer.length,
                compressLevel: compressionLevel,
                minSize: 300 * 1024,
                maxSize: mbToBytes(5),
            });
            const mediaCompressed = await this.optimize(media.media_type, buffer, targetSize, 100);
            log.info('Media compressed', {
                media_id: media.id,
                media_bytes: mediaCompressed.size,
                target_size: targetSize,
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
                    deletePaths: [sourcePath],
                });
                return;
            }

            const [thumbnailWriteOk, mediaWriteOk] = await Promise.all([
                this.storageService.write(thumbnail.buffer, thumbnailPath),
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

            const [shape, aspect_ratio] = await Promise.all([
                this.compressService.getImageShape(mediaCompressed.buffer),
                this.compressService.getImageAspectRatio(mediaCompressed.buffer),
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
