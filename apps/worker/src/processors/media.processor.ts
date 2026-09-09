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
    PREVIEW_TARGET_BYTES,
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
import {
    PREVIEW_MAX_DURATION_SECONDS,
    VIDEO_PREVIEW_FRAME_PERCENTAGES,
} from "@repo/common-lib/constants/limits";
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
            // Cleared, never merely left alone: a retry that fails after an earlier attempt
            // committed would otherwise leave FAILED sitting on a stale `completed_at`, and
            // anything reading that column as "this media is done" believes it.
            completed_at: null,
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
     * For video the frames have to be extracted AND uploaded first: moderation is a vision call
     * over URLs (`image_url`) and cannot read an MP4, so those frames are what gets judged.
     * Judging before the transcode is also what makes a rejection cheap — banned content never
     * reaches ffmpeg. The trade is that a rejected video leaves its frames in the bucket, which
     * is why the caller deletes them alongside the source.
     *
     * Images and GIFs keep the original order: the stored upload is already something the
     * vision model can read, so there is nothing to gain from writing the thumbnail first.
     */
    private async buildThumbnailAndModerate(
        media: Media,
        buffer: Buffer,
        sourcePath: string,
        mediaPath: string,
        thumbnailPath: string,
        /**
         * Keys this job may have to clean up. The video branch registers its frames the moment
         * it knows their names, so a failure part-way through those uploads still leaves nothing
         * behind in the bucket.
         */
        deletePaths: Set<string>,
    ): Promise<{
        thumbnail: CompressionOutput;
        /** Where the thumbnail lives: `previews[0]`'s key for video, the poster key otherwise. */
        thumbnailPath: string;
        /** Video only. The frames moderation judged, `previews[0]` being the thumbnail itself. */
        previews: CompressionOutput[] | null;
        previewPaths: string[] | null;
        moderation: ContentModerationFields;
        /** Keys already in storage, which the caller must not rewrite. */
        writtenPaths: string[];
    } | null> {
        if (media.media_type === 'VIDEO') {
            // Several frames rather than one poster: a verdict drawn from the opening second
            // can only ever vouch for the opening second. See `extractVideoFrames`.
            const previews = await this.compressService.extractVideoFrames({
                file: buffer,
                targetSize: THUMBNAIL_TARGET_BYTES,
                percentages: VIDEO_PREVIEW_FRAME_PERCENTAGES,
                quality: 80,
                maxEdgePx: THUMBNAIL_MAX_EDGE_PX,
            });
            const [poster] = previews;
            if (!poster) {
                throw new Error('No frames could be extracted from the video');
            }

            const previewPaths = previews.map((_, index) =>
                MediaHelper.previewScreenshotPath(mediaPath, index),
            );
            previewPaths.forEach((path) => deletePaths.add(path));

            const writes = await Promise.all(
                previews.map((preview, index) =>
                    this.storageService.write(preview.buffer, previewPaths[index]!),
                ),
            );
            if (!writes.every(Boolean)) return null;

            // Every frame in ONE call. The image tokens cost the same either way, but a single
            // request yields a single verdict, a single usage record and a single moderation
            // job — three calls would have to be reconciled into one decision here, and any
            // rule for doing that is a rule for letting a bad frame through.
            const { moderation } = await this.aiService.moderateContent(
                await Promise.all(
                    previewPaths.map((path) => this.storageService.getUrl(path)),
                ),
                { user_id: media.user_id },
            );

            return {
                // The thumbnail IS `previews[0]`: one object, one key, two columns. That is what
                // keeps every existing thumbnail consumer — grid tiles, video poster, OG and
                // sitemap images, AI SEO metadata — working unchanged for video, and it means
                // the frame is never written, billed or deleted twice.
                thumbnail: poster,
                thumbnailPath: previewPaths[0]!,
                previews,
                previewPaths,
                moderation,
                writtenPaths: previewPaths,
            };
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
        return {
            thumbnail,
            thumbnailPath,
            previews: null,
            previewPaths: null,
            moderation,
            writtenPaths: [],
        };
    }

    /**
     * Resolves the video's preview clip, encoding one only when the source needs it.
     *
     * `optimizeVideo` has already probed the source, so asking "is this shorter than the preview
     * window?" costs nothing. When it is, the media IS its own preview and the column points at
     * `mediaPath`: no encode, no second object, no extra PUT, nothing charged against the user's
     * quota. Callers therefore cannot assume the two keys differ — the API's delete and its
     * SEO-rename both account for that.
     *
     * @returns the key to persist plus the clip to upload, or `null` for non-video.
     */
    private async resolveVideoPreview(
        mediaCompressed: CompressionOutput | VideoCompressionOutput,
        buffer: Buffer,
        mediaPath: string,
        compressLevel: NonNullable<Media['compression_level']>,
    ): Promise<{ path: string; clip: VideoCompressionOutput | null } | null> {
        if (!('durationSeconds' in mediaCompressed)) return null;

        if (mediaCompressed.durationSeconds <= PREVIEW_MAX_DURATION_SECONDS) {
            return { path: mediaPath, clip: null };
        }

        // From the ORIGINAL source, not from the compressed output: chaining lossy H.264 makes
        // the second encoder spend its bits faithfully reproducing the first one's blocking.
        // `-t` bounds the cost either way — only the clip's own seconds are ever decoded.
        const clip = await this.compressService.optimizeVideoPreview(
            buffer,
            PREVIEW_TARGET_BYTES,
            compressionLevelToQuality(compressLevel),
        );
        return { path: MediaHelper.videoPreviewPath(mediaPath), clip };
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
        // Grows as the job commits to each key. A video's frames and its preview clip cannot be
        // named up front — the frame count comes from the extractor and the clip's key depends
        // on whether one is needed at all — and every key that gets written has to be reachable
        // from the failure branches below, or a rejected upload leaves orphans behind.
        const deletePaths = new Set([sourcePath, mediaPath, thumbnailPath]);
        // Gates the catch below: once the row is COMPLETED the output is real, and a later error
        // must not be allowed to revert it or delete it.
        let completed = false;

        try {
            log.info('Process media job', {
                media_id: media.id,
                public_id: media.public_id,
                user_id: media.user_id,
                status: media.status,
                media_type: media.media_type,
            });

            // BullMQ redelivers a job whose lock it lost, and `media` is the snapshot taken when
            // the job was queued (still UPLOADING), so the only way to notice that an earlier
            // attempt already finished is to read the row back.
            //
            // Without this guard a redelivery re-ran the whole pipeline against storage that the
            // first attempt had already rewritten: video died on a source its own first attempt
            // had deleted and then deleted the finished output on the way out, while images
            // silently re-compressed the first attempt's output once per attempt.
            const current = await this.mediaRepository.findOneByColumn('id', media.id);
            if (!current) {
                log.info('Skipping media processing: media no longer exists', {
                    media_id: media.id,
                    public_id: media.public_id,
                });
                return;
            }
            if (MediaHelper.isCompleted(current)) {
                log.info('Skipping media processing: already completed by an earlier attempt', {
                    media_id: media.id,
                    public_id: media.public_id,
                    completed_at: current.completed_at,
                });
                return;
            }

            const buffer = await this.storageService.getBuffer(sourcePath);

            const prepared = await this.buildThumbnailAndModerate(
                media,
                buffer,
                sourcePath,
                mediaPath,
                thumbnailPath,
                deletePaths,
            );
            if (!prepared) {
                await this.markFailed(media, 'Storage write could not complete', log, {
                    deletePaths: [...deletePaths],
                });
                return;
            }
            const { thumbnail, previews, previewPaths, moderation, writtenPaths } = prepared;
            // For video this is `previews[0]`'s key, not the `-thumbnail.webp` one: the same
            // object serves both columns.
            const resolvedThumbnailPath = prepared.thumbnailPath;
            // Frame 0's bytes are in here too, since it IS the thumbnail. Null for everything
            // that has no frames, which is what keeps `MediaHelper.storageBytes` honest.
            const previewsBytes = previews
                ? previews.reduce((total, preview) => total + preview.size, 0)
                : null;

            log.info('Moderation result', {
                media_id: media.id,
                public_id: media.public_id,
                is_allowed: moderation.is_allowed,
                severity: moderation.severity,
                // Video is judged on the frames sampled from it, not on the video itself.
                moderated_paths: writtenPaths.length ? writtenPaths : [sourcePath],
            });

            if (!moderation.is_allowed) {
                await this.markFailed(media, moderation.reason, log, {
                    // A video's frames are already in the bucket — they had to be, for the
                    // vision model to read them — so they go too, or a rejected upload leaves
                    // orphans nothing will ever clean up.
                    deletePaths: [sourcePath, ...writtenPaths],
                });
                return;
            }

            log.info('Thumbnail compressed', {
                media_id: media.id,
                thumbnail_bytes: thumbnail.size,
                ...(previews
                    ? { previews_count: previews.length, previews_bytes: previewsBytes }
                    : {}),
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

            const videoPreview = await this.resolveVideoPreview(
                mediaCompressed,
                buffer,
                mediaPath,
                compressionLevel,
            );
            if (videoPreview?.clip) {
                deletePaths.add(videoPreview.path);
                log.info('Video preview clip encoded', {
                    media_id: media.id,
                    video_preview_bytes: videoPreview.clip.size,
                    duration_seconds: videoPreview.clip.durationSeconds,
                    bit_rate: videoPreview.clip.bitRate,
                });
            } else if (videoPreview) {
                log.info('Video is its own preview; no clip encoded', {
                    media_id: media.id,
                    duration_seconds:
                        'durationSeconds' in mediaCompressed
                            ? Math.round(mediaCompressed.durationSeconds)
                            : null,
                });
            }

            // The same arithmetic the row will be stored with, so the quota gate and the
            // recomputed metric can never disagree: an aliased asset contributes nothing, and
            // `thumbnail` is inside `previewsBytes` rather than added on top of it.
            const totalSize = MediaHelper.storageBytes({
                bytes: mediaCompressed.size,
                thumbnail_bytes: thumbnail.size,
                previews_bytes: previewsBytes,
                video_preview_bytes: videoPreview?.clip?.size ?? null,
            });
            const limitReason = await this.checkUserLimits(
                media.user_id,
                totalSize,
                false,
            );
            if (limitReason) {
                await this.markFailed(media, limitReason, log, {
                    deletePaths: [sourcePath, ...writtenPaths],
                });
                return;
            }

            const [thumbnailWriteOk, mediaWriteOk, videoPreviewWriteOk] = await Promise.all([
                // A video's frames went up before moderation so the vision model could read
                // them; re-uploading identical bytes would just be a second PUT.
                writtenPaths.includes(resolvedThumbnailPath)
                    ? Promise.resolve(true)
                    : this.storageService.write(thumbnail.buffer, resolvedThumbnailPath),
                this.storageService.write(mediaCompressed.buffer, mediaPath),
                // Nothing to write when the media is its own preview.
                videoPreview?.clip
                    ? this.storageService.write(videoPreview.clip.buffer, videoPreview.path)
                    : Promise.resolve(true),
            ]);

            if (!thumbnailWriteOk || !mediaWriteOk || !videoPreviewWriteOk) {
                await this.markFailed(media, 'Storage write could not complete', log, {
                    deletePaths: [...deletePaths],
                });
                return;
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
                thumbnail: resolvedThumbnailPath,
                previews: previewPaths,
                previews_bytes: previewsBytes,
                video_preview: videoPreview?.path ?? null,
                // Null when the clip is the media itself: those bytes are already `bytes`, and
                // repeating them here would double-charge the user's storage.
                video_preview_bytes: videoPreview?.clip?.size ?? null,
                url: mediaPath,
                extension,
                shape,
                aspect_ratio,
                status: 'COMPLETED',
                completed_at: new Date(),
                failed_reason: null,
            });
            completed = true;

            // Deliberately after the commit, not before it. Deleting the source earlier left a
            // window where a crash between the delete and the commit stranded the media for good:
            // the retry found neither a finished row to skip nor the source it needed to redo the
            // work. Now every step up to the commit can be repeated safely.
            if (sourcePath !== mediaPath) {
                await this.storageService.delete(sourcePath);
            }

            // One job per DISTINCT object. `thumbnail` is `previews[0]` and an aliased
            // `video_preview` is `mediaPath`, so billing either separately would charge the
            // same stored bytes twice.
            const billedObjects: { path: string; bytes: number }[] = [
                { path: mediaPath, bytes: mediaCompressed.size },
                ...(previews && previewPaths
                    ? previews.map((preview, index) => ({
                        path: previewPaths[index]!,
                        bytes: preview.size,
                    }))
                    : [{ path: resolvedThumbnailPath, bytes: thumbnail.size }]),
                ...(videoPreview?.clip
                    ? [{ path: videoPreview.path, bytes: videoPreview.clip.size }]
                    : []),
            ];

            await Promise.all([
                ...billedObjects.map((object) =>
                    QueueHelper.createStorageRequestJob({
                        path: object.path,
                        bytes: object.bytes,
                        user_id: media.user_id,
                    }),
                ),
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
                thumbnail_path: resolvedThumbnailPath,
                media_path: mediaPath,
                storage_bytes: totalSize,
                ...(previewPaths ? { preview_paths: previewPaths } : {}),
                ...(videoPreview
                    ? {
                        video_preview_path: videoPreview.path,
                        // False means the media is its own preview — worth having in the log,
                        // since it is the difference between one stored object and two.
                        video_preview_encoded: !!videoPreview.clip,
                    }
                    : {}),
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

            // This catch covers everything after the COMPLETED commit too - the follow-up queue
            // jobs and the metadata hand-off. Marking FAILED there would revert a good row, and
            // `deletePaths` would delete the media and thumbnail that are already serving.
            // Whatever broke here is bookkeeping; the upload itself succeeded.
            if (completed) {
                log.error('Media processing failed after completion; leaving the media intact', {
                    media_id: media.id,
                    public_id: media.public_id,
                    failed_reason: message,
                });
                return;
            }

            // `createProcessMediaJob` configures `attempts: 3` with an exponential backoff —
            // but that config does nothing unless BullMQ is told this attempt failed. Every
            // path above returns normally, which the Worker reads as SUCCESS, so a plain
            // `return` here would too: it resolves `processMedia()`'s promise, BullMQ marks the
            // job COMPLETED, and the other two configured attempts never run. That is exactly
            // what happened to a video whose transcode overran its timeout — a single slow
            // encode became a permanent failure with zero retries, because nothing ever told
            // the queue to retry it.
            //
            // Rethrowing is what actually engages `attempts`/`backoff`, and mirrors the exact
            // arithmetic `Job.shouldRetryJob` uses internally: `attemptsMade` counts attempts
            // already CONSUMED before this one, so this is the last one precisely when
            // `attemptsMade + 1 >= attempts`. On every earlier attempt the row is left as-is
            // (still its pre-job status, e.g. UPLOADING) rather than flapping to FAILED and
            // back if the retry succeeds, and nothing in `deletePaths` — the source above all —
            // is deleted, since the next attempt reads that same source back from storage.
            const maxAttempts = this.job.opts?.attempts ?? 1;
            const attempt = (this.job.attemptsMade ?? 0) + 1;
            const isFinalAttempt = attempt >= maxAttempts;
            if (!isFinalAttempt) {
                log.warn('Media processing attempt failed; will retry', {
                    media_id: media.id,
                    public_id: media.public_id,
                    attempt,
                    max_attempts: maxAttempts,
                    failed_reason: message,
                });
                throw error;
            }

            await this.markFailed(media, message, log, {
                deletePaths: [...deletePaths],
            });
        }
    }
}
