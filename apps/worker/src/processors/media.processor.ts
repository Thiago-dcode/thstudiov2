import { JOB_PROCESS_MEDIA } from "@repo/common-lib/constants/queues";
import { Job } from "bullmq";
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { FactoryStorageService } from '@repo/backend-lib/services/storage-service/factory';
import { compressConfig, s3StorageConfig } from "@repo/backend-lib/config/storage";
import { AiService } from "@repo/backend-lib/services/ai-service";
import { FactoryLLMService } from "@repo/backend-lib/services/llm-service/factory";
import { openAiLLMConfig } from "@repo/backend-lib/config/llm";
import { FactoryLogService, LogService } from "@repo/backend-lib/services/log-service";
import { CompressService } from '@repo/backend-lib/services/compress-service/base';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { Media } from "@repo/common-lib/types/media";
import { MediaRepository } from "@repo/database/repositories/media";
import { UserExtraDataRepository } from "@repo/database/repositories/user-extra-data";
import { PlansRepository } from "@repo/database/repositories/plans";
import { QueueHelper } from "@repo/backend-lib/utils";
import { bytesToMB, mbToBytes } from "@repo/common-lib/utils/bytes";
import { DEFAULT_COMPRESSION_LVL } from "@repo/common-lib/constants/enums";
import { UserLimits } from "@repo/common-lib/utils/user-limits";
import { BasePlan } from "@repo/common-lib/types/plan";

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

    /** `{base}.webp` → `{base}-thumbnail.webp` — aligned with MediaService.buildMediaStoragePaths. */
    private resolveThumbnailPath(mediaUrl: string): string {
        return mediaUrl.replace(/\.webp$/, '-thumbnail.webp');
    }

    async processMedia() {
        const log = this.logger.name('create');
        const data: Media = this.job.data;

        try {
            log.info('Process media job', {
                media_id: data.id,
                public_id: data.public_id,
                user_id: data.user_id,
                status: data.status,
            });

            const url = await this.storageService.getUrl(data.url);
            const { moderation } = await this.aiService.moderateContent(url, {
                user_id: data.user_id,
            });

            log.info('Moderation result', {
                media_id: data.id,
                public_id: data.public_id,
                is_allowed: moderation.is_allowed,
                severity: moderation.severity,
            });

            if (!moderation.is_allowed) {
                await this.markFailed(data, moderation.reason, log, {
                    deletePaths: [data.url],
                });
                return;
            }

            log.info('Starting compression', {
                media_id: data.id,
                compression_level: data.compression_level,
                driver: this.compressService.config.driver,
            });

            const buffer = await this.storageService.getBuffer(data.url);
            const thumbnailPath = this.resolveThumbnailPath(data.url);
            const thumbnail = await this.compressService.optimizeImageToWebp(buffer, 200 * 1024, 90);
            log.info('Thumbnail compressed', {
                media_id: data.id,
                thumbnail_bytes: thumbnail.size,
            });

            const compressionLevel = data.compression_level || DEFAULT_COMPRESSION_LVL;
            const targetSize = this.compressService.getSizeCompressed({
                size: buffer.length,
                compressLevel: compressionLevel,
                minSize: 300 * 1024,
                maxSize: mbToBytes(5),
            });
            const mediaCompressed = await this.compressService.optimizeImageToWebp(buffer, targetSize, 100);
            log.info('Media compressed', {
                media_id: data.id,
                media_bytes: mediaCompressed.size,
                target_size: targetSize,
            });

            const totalSize = mediaCompressed.size + thumbnail.size;
            const limitReason = await this.checkUserLimits(
                data.user_id,
                totalSize,
                false,
            );
            if (limitReason) {
                await this.markFailed(data, limitReason, log, {
                    deletePaths: [data.url],
                });
                return;
            }

            const [thumbnailWriteOk, mediaWriteOk] = await Promise.all([
                this.storageService.write(thumbnail.buffer, thumbnailPath),
                this.storageService.write(mediaCompressed.buffer, data.url),
            ]);

            if (!thumbnailWriteOk || !mediaWriteOk) {
                await this.markFailed(data, 'Storage write could not complete', log, {
                    deletePaths: [data.url, thumbnailPath],
                });
                return;
            }

            const [shape, aspect_ratio] = await Promise.all([
                this.compressService.getImageShape(mediaCompressed.buffer),
                this.compressService.getImageAspectRatio(mediaCompressed.buffer),
            ]);

            await this.mediaRepository.updateById(data.id, {
                bytes: mediaCompressed.size,
                thumbnail_bytes: thumbnail.size,
                thumbnail: thumbnailPath,
                shape,
                aspect_ratio,
                status: 'COMPLETED',
                completed_at: new Date(),
                failed_reason: null,
            });

            await QueueHelper.createStorageRequestJob({
                path: data.url,
                bytes: mediaCompressed.size,
                user_id: data.user_id,
            });
            await QueueHelper.createStorageRequestJob({
                path: thumbnailPath,
                bytes: thumbnail.size,
                user_id: data.user_id,
            });
            await QueueHelper.createComputeUserMetricsJob(data.user_id);
            await this.notifyMediaUpdate(data);

            log.info('Media processing completed', {
                media_id: data.id,
                public_id: data.public_id,
                bytes: mediaCompressed.size,
                thumbnail_bytes: thumbnail.size,
                thumbnail_path: thumbnailPath,
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Media processing failed';
            log.error(message, error);
            const thumbnailPath = this.resolveThumbnailPath(data.url);
            await this.markFailed(data, message, log, {
                deletePaths: [data.url, thumbnailPath],
            });
        }
    }
}
