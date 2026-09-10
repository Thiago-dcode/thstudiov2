import { Job } from 'bullmq';
import { QueueHelper } from '@repo/backend-lib/utils';
import {
    compressionLevelToQuality,
    MediaInputError,
    THUMBNAIL_MAX_EDGE_PX,
    THUMBNAIL_TARGET_BYTES,
    VIDEO_SAMPLE_FRAME_MAX_EDGE_PX,
    VIDEO_SAMPLE_FRAME_TARGET_BYTES,
} from '@repo/backend-lib/services/compress-service/base';
import { FactoryCompressService } from '@repo/backend-lib/services/compress-service/factory';
import { EnumType } from '@repo/common-lib/constants/enums';
import { UserLimits } from '@repo/common-lib/utils/user-limits';
import { MediaProcessor } from './media.processor';

/**
 * Both cases here are the same production incident from opposite ends.
 *
 * BullMQ redelivered a media job whose lock had lapsed while the first attempt was still
 * transcoding. The second attempt re-ran the pipeline against storage the first attempt had
 * already rewritten: it read a source that had been deleted, failed with S3's "The specified
 * key does not exist.", and then - because the catch-all deletes `deletePaths` - deleted the
 * finished video and its thumbnail and reverted a COMPLETED row to FAILED. The upload itself
 * had succeeded; only the retry destroyed it.
 *
 * The redelivery is prevented elsewhere (worker `lockDuration`, Redis `noeviction`). These
 * assertions cover the processor holding the line if one happens anyway.
 */
describe('MediaProcessor.processMedia', () => {
    const media = {
        id: 21,
        public_id: 'd5cda095-c43f-4df5-bbea-e0d292188c26',
        user_id: 2,
        media_type: 'VIDEO' as const,
        status: 'UPLOADING' as const,
        compression_level: 'HIGH' as const,
        url: 'users/u/media/m/hero-drone-video.source.mp4',
    };

    beforeEach(() => {
        // Same reason as the collection slug specs: the failure path notifies through
        // QueueHelper, which opens a real BullMQ Redis connection and hangs the run.
        jest
            .spyOn(QueueHelper, 'createOrUpdateUserNotificationJob')
            .mockResolvedValue(undefined);
    });

    const buildLogger = () => {
        const log = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        return { logger: { name: () => log } as any, log };
    };

    /** Only the collaborators these two paths actually reach need to behave. */
    const build = (
        currentRow: Record<string, unknown> | null,
        overrides: {
            storage?: Record<string, unknown>;
            job?: { attempts?: number; attemptsMade?: number };
        } = {},
    ) => {
        const { logger, log } = buildLogger();
        const storageService = {
            getBuffer: jest.fn(),
            write: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
            getUrl: jest.fn().mockResolvedValue('https://cdn.test/x'),
            ...overrides.storage,
        };
        const mediaRepository = {
            findOneByColumn: jest.fn().mockResolvedValue(currentRow),
            updateById: jest.fn().mockResolvedValue({ ...media, status: 'FAILED' }),
        };
        // `opts.attempts` / `attemptsMade` drive the catch-path retry gate: without them a
        // rethrown failure never engages BullMQ's backoff, and without them in the mock the
        // final-attempt FAILED path would crash reading `job.opts.attempts`.
        const job = {
            data: { media, generate_metadata: false },
            opts: { attempts: overrides.job?.attempts ?? 1 },
            attemptsMade: overrides.job?.attemptsMade ?? 0,
        } as unknown as Job;

        const processor = new MediaProcessor(
            job,
            storageService as any,
            {} as any,
            {} as any,
            mediaRepository as any,
            {} as any,
            {} as any,
            logger,
        );

        return { processor, storageService, mediaRepository, log };
    };

    it('skips a job whose media an earlier attempt already completed', async () => {
        const { processor, storageService, mediaRepository } = build({
            ...media,
            status: 'COMPLETED',
            completed_at: new Date('2026-09-05T10:47:46.692Z'),
            blocked_at: null,
        });

        await processor.processMedia();

        // The decisive one: never re-read the source, so the transcode is never redone.
        expect(storageService.getBuffer).not.toHaveBeenCalled();
        // ...and never touch the files the first attempt produced.
        expect(storageService.delete).not.toHaveBeenCalled();
        expect(storageService.write).not.toHaveBeenCalled();
        // ...and never revert the completed row.
        expect(mediaRepository.updateById).not.toHaveBeenCalled();
    });

    it('skips a job whose media row has since been deleted', async () => {
        const { processor, storageService, mediaRepository } = build(null);

        await processor.processMedia();

        expect(storageService.getBuffer).not.toHaveBeenCalled();
        expect(mediaRepository.updateById).not.toHaveBeenCalled();
    });

    it('still marks a genuinely unfinished media FAILED and cleans its paths up', async () => {
        // The pre-completion failure path has to keep working: an upload that never finished
        // should not leave orphans in the bucket just because the guards were added.
        const notFound = Object.assign(new Error('The specified key does not exist.'), {
            name: 'NoSuchKey',
        });
        const { processor, storageService, mediaRepository } = build(
            { ...media, status: 'UPLOADING', completed_at: null, blocked_at: null },
            { storage: { getBuffer: jest.fn().mockRejectedValue(notFound) } },
        );

        await processor.processMedia();

        expect(mediaRepository.updateById).toHaveBeenCalledWith(
            media.id,
            expect.objectContaining({
                status: 'FAILED',
                failed_reason: 'The specified key does not exist.',
                // FAILED and completed_at must never coexist. A retry failing after an earlier
                // attempt committed would otherwise leave the timestamp behind, and every reader
                // treating it as "this media is done" believes it - which is how a failed upload
                // reached the atelier grid. The media table has a CHECK constraint for the same
                // invariant, so leaving this out would now fail the write outright.
                completed_at: null,
            }),
        );
        expect(storageService.delete).toHaveBeenCalled();
    });

    it('rethrows on a non-final attempt so BullMQ can retry instead of marking FAILED', async () => {
        const notFound = Object.assign(new Error('The specified key does not exist.'), {
            name: 'NoSuchKey',
        });
        const { processor, storageService, mediaRepository, log } = build(
            { ...media, status: 'UPLOADING', completed_at: null, blocked_at: null },
            {
                storage: { getBuffer: jest.fn().mockRejectedValue(notFound) },
                // attempts: 3, attemptsMade: 0 → this is attempt 1 of 3, not the last one.
                job: { attempts: 3, attemptsMade: 0 },
            },
        );

        await expect(processor.processMedia()).rejects.toBe(notFound);

        // Leave the row and its files alone for the next attempt.
        expect(mediaRepository.updateById).not.toHaveBeenCalled();
        expect(storageService.delete).not.toHaveBeenCalled();
        expect(log.warn).toHaveBeenCalledWith(
            'Media processing attempt failed; will retry',
            expect.objectContaining({
                media_id: media.id,
                attempt: 1,
                max_attempts: 3,
            }),
        );
    });

    /**
     * A media that could not be processed was retried the full three times. Each attempt
     * re-downloaded the source and paid OpenAI for another moderation verdict - billed to the
     * user's token usage - before reaching the identical error, so one unprocessable upload cost
     * three downloads and three vision calls to conclude what the first probe already knew.
     */
    describe('a failure the input itself decides', () => {
        const tooLong = new MediaInputError(
            'Video is too long: 903s, maximum is 600s',
        );

        const buildPermanent = () =>
            build(
                { ...media, status: 'UPLOADING', completed_at: null, blocked_at: null },
                {
                    storage: { getBuffer: jest.fn().mockRejectedValue(tooLong) },
                    // Attempt 1 of 3: the retry gate would normally rethrow here.
                    job: { attempts: 3, attemptsMade: 0 },
                },
            );

        it('fails the media immediately instead of spending the other two attempts', async () => {
            const { processor, mediaRepository, log } = buildPermanent();

            // Resolving rather than throwing is what tells BullMQ there is nothing to retry.
            await expect(processor.processMedia()).resolves.toBeUndefined();

            expect(mediaRepository.updateById).toHaveBeenCalledWith(
                media.id,
                expect.objectContaining({
                    status: 'FAILED',
                    // Verbatim: this is what the user reads, and it names the limit they hit.
                    failed_reason: tooLong.message,
                    completed_at: null,
                }),
            );
            expect(log.warn).not.toHaveBeenCalledWith(
                'Media processing attempt failed; will retry',
                expect.anything(),
            );
        });

        it('cleans the upload out of storage, since no later attempt needs it', async () => {
            const { processor, storageService } = buildPermanent();

            await processor.processMedia();

            expect(storageService.delete).toHaveBeenCalledWith(media.url);
        });

        it('still retries a transient failure carrying a permanent-looking message', async () => {
            // The guard keys on the error, not on the media: an S3 read that happens to fail
            // while the file is large is still worth another attempt.
            const transient = new Error('socket hang up');
            const { processor, storageService, mediaRepository } = build(
                { ...media, status: 'UPLOADING', completed_at: null, blocked_at: null },
                {
                    storage: { getBuffer: jest.fn().mockRejectedValue(transient) },
                    job: { attempts: 3, attemptsMade: 0 },
                },
            );

            await expect(processor.processMedia()).rejects.toBe(transient);

            expect(mediaRepository.updateById).not.toHaveBeenCalled();
            expect(storageService.delete).not.toHaveBeenCalled();
        });
    });

    /**
     * The compression level used to reach the image and GIF encoders as nothing at all: `optimize`
     * hardcoded a quality of 100 and let `targetSize` carry the level on its own. But the target
     * is a CEILING that a refine loop chases only on overshoot, and a GIF routinely lands far
     * under it - so the level changed nothing, and the same 18,488,331-byte upload came back as
     * 1,549,897 bytes at both VERY_LOW and HIGH.
     */
    describe('the compression level reaching the encoder', () => {
        const SOURCE_BYTES = 18_488_331;

        const buildGif = (level: EnumType<'COMPRESSION_LEVEL'>) => {
            const { logger } = buildLogger();
            const gifMedia = {
                ...media,
                media_type: 'GIF' as const,
                compression_level: level,
                url: 'users/u/media/m/jigglypuff-ball.gif',
            };
            const compressed = {
                filename: 'jigglypuff-ball.gif',
                size: 1_549_897,
                buffer: Buffer.alloc(8),
                reencoded: true,
            };
            // The REAL `getSizeCompressed`, so this covers the target arithmetic and the quality
            // argument in one pass - the two halves of the bug were independent, and either one
            // alone was enough to make both levels produce the same file.
            const real = FactoryCompressService.create({ driver: 'sharp' });
            const compressService = {
                config: { driver: 'sharp' },
                getSizeCompressed: real.getSizeCompressed.bind(real),
                optimizeGif: jest.fn().mockResolvedValue(compressed),
                optimizeImageToWebp: jest.fn().mockResolvedValue({
                    filename: 'jigglypuff-ball-thumbnail.webp',
                    size: 5_584,
                    buffer: Buffer.alloc(4),
                    reencoded: true,
                }),
                getImageShape: jest.fn().mockResolvedValue('LANDSCAPE'),
                getImageAspectRatio: jest.fn().mockResolvedValue('16:9'),
            };
            const storageService = {
                getBuffer: jest.fn().mockResolvedValue(Buffer.alloc(SOURCE_BYTES)),
                write: jest.fn().mockResolvedValue(true),
                delete: jest.fn().mockResolvedValue(true),
                getUrl: jest.fn().mockResolvedValue('https://cdn.test/x'),
            };
            const aiService = {
                moderateContent: jest.fn().mockResolvedValue({
                    moderation: { is_allowed: true, severity: 0, reason: null },
                }),
            };
            const mediaRepository = {
                findOneByColumn: jest.fn().mockResolvedValue({
                    ...gifMedia,
                    completed_at: null,
                    blocked_at: null,
                }),
                updateById: jest.fn().mockResolvedValue({
                    ...gifMedia,
                    status: 'COMPLETED',
                    completed_at: new Date(),
                    blocked_at: null,
                }),
            };
            const job = {
                data: { media: gifMedia, generate_metadata: false },
                opts: { attempts: 3 },
                attemptsMade: 0,
            } as unknown as Job;

            const processor = new MediaProcessor(
                job,
                storageService as any,
                compressService as any,
                aiService as any,
                mediaRepository as any,
                { findByUserId: jest.fn().mockResolvedValue({ storage_used_mb: 0 }) } as any,
                {
                    findUserActivePlan: jest.fn().mockResolvedValue(null),
                    findFreePlan: jest.fn().mockResolvedValue({ name: 'Free' }),
                } as any,
                logger,
            );

            return { processor, compressService };
        };

        beforeEach(() => {
            jest.spyOn(UserLimits, 'storageSize').mockReturnValue(true);
            jest
                .spyOn(QueueHelper, 'createStorageRequestJob')
                .mockResolvedValue(undefined as never);
            jest
                .spyOn(QueueHelper, 'createComputeUserMetricsJob')
                .mockResolvedValue(undefined as never);
            jest
                .spyOn(QueueHelper, 'createUpdateProfileStatusJob')
                .mockResolvedValue(undefined as never);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('passes the level as a real quality argument, not a hardcoded 100', async () => {
            const { processor, compressService } = buildGif('HIGH');

            await processor.processMedia();

            expect(compressService.optimizeGif).toHaveBeenCalledWith(
                expect.any(Buffer),
                expect.any(Number),
                compressionLevelToQuality('HIGH'),
            );
        });

        it('encodes the thumbnail at the media\'s own level, not a fixed quality', async () => {
            const { processor, compressService } = buildGif('VERY_HIGH');

            await processor.processMedia();

            // A tile that stays pristine while the media it stands for is squeezed shows the
            // user something their media no longer looks like.
            expect(compressService.optimizeImageToWebp).toHaveBeenCalledWith(
                expect.any(Buffer),
                THUMBNAIL_TARGET_BYTES,
                compressionLevelToQuality('VERY_HIGH'),
                THUMBNAIL_MAX_EDGE_PX,
            );
        });

        it('gives two levels two different targets and two different qualities', async () => {
            const loose = buildGif('VERY_LOW');
            const tight = buildGif('HIGH');

            await loose.processor.processMedia();
            await tight.processor.processMedia();

            const [, looseTarget, looseQuality] =
                loose.compressService.optimizeGif.mock.calls[0]!;
            const [, tightTarget, tightQuality] =
                tight.compressService.optimizeGif.mock.calls[0]!;

            // Both used to be equal: the target saturated a 5MB cap applied AFTER the ratio, and
            // the quality was the same literal either way.
            expect(tightTarget).toBeLessThan(looseTarget);
            expect(tightQuality).toBeLessThan(looseQuality);
        });
    });

    /**
     * A video stores `VIDEO_PREVIEW_FRAMES` stills and each is billed separately, so the frames
     * outweigh every other object the media owns put together. Only frame 0 is ever displayed -
     * it IS the thumbnail. The rest exist to be read by the moderation and SEO models, which is
     * why they must not be encoded as if a person were going to look at them.
     */
    describe('video frames', () => {
        /** Runs a video through the processor and returns what `extractVideoFrames` was asked for. */
        const captureFrameInput = async (level: EnumType<'COMPRESSION_LEVEL'>) => {
            const { logger } = buildLogger();
            const videoMedia = { ...media, compression_level: level };
            const frame = (size: number) => ({
                filename: 'f.webp',
                size,
                buffer: Buffer.alloc(4),
                reencoded: true,
            });
            const compressService = {
                config: { driver: 'sharp' },
                getSizeCompressed: jest.fn().mockReturnValue(20_000_000),
                extractVideoFrames: jest
                    .fn()
                    .mockResolvedValue([frame(90_000), frame(9_000), frame(9_000)]),
                optimizeVideo: jest.fn().mockResolvedValue({
                    filename: 'hero.mp4',
                    size: 8_000_000,
                    buffer: Buffer.alloc(8),
                    width: 1920,
                    height: 1080,
                    durationSeconds: 4,
                    bitRate: 3_000_000,
                    reencoded: true,
                }),
                getImageShape: jest.fn().mockResolvedValue('LANDSCAPE'),
                getImageAspectRatio: jest.fn().mockResolvedValue('16:9'),
            };
            const processor = new MediaProcessor(
                {
                    data: { media: videoMedia, generate_metadata: false },
                    opts: { attempts: 3 },
                    attemptsMade: 0,
                } as unknown as Job,
                {
                    getBuffer: jest.fn().mockResolvedValue(Buffer.alloc(64)),
                    write: jest.fn().mockResolvedValue(true),
                    delete: jest.fn().mockResolvedValue(true),
                    getUrl: jest.fn().mockResolvedValue('https://cdn.test/x'),
                } as any,
                compressService as any,
                {
                    moderateContent: jest.fn().mockResolvedValue({
                        moderation: { is_allowed: true, severity: 0, reason: null },
                    }),
                } as any,
                {
                    findOneByColumn: jest
                        .fn()
                        .mockResolvedValue({ ...videoMedia, completed_at: null, blocked_at: null }),
                    updateById: jest.fn().mockResolvedValue({
                        ...videoMedia,
                        status: 'COMPLETED',
                        completed_at: new Date(),
                        blocked_at: null,
                    }),
                } as any,
                { findByUserId: jest.fn().mockResolvedValue({ storage_used_mb: 0 }) } as any,
                {
                    findUserActivePlan: jest.fn().mockResolvedValue(null),
                    findFreePlan: jest.fn().mockResolvedValue({ name: 'Free' }),
                } as any,
                logger,
            );

            await processor.processMedia();

            const [input] = compressService.extractVideoFrames.mock.calls[0]!;
            return input as {
                poster: { targetSize: number; quality: number; maxEdgePx: number };
                sample: { targetSize: number; quality: number; maxEdgePx: number };
            };
        };

        it('spends thumbnail bytes on the poster and a fraction of them on the samples', async () => {
            const input = await captureFrameInput('HIGH');

            // Frame 0 is the grid tile, the og:image and the sitemap image.
            expect(input.poster).toEqual({
                targetSize: THUMBNAIL_TARGET_BYTES,
                quality: compressionLevelToQuality('HIGH'),
                maxEdgePx: THUMBNAIL_MAX_EDGE_PX,
            });
            // Frames 1..N are never rendered anywhere.
            expect(input.sample.targetSize).toBe(VIDEO_SAMPLE_FRAME_TARGET_BYTES);
            expect(input.sample.maxEdgePx).toBe(VIDEO_SAMPLE_FRAME_MAX_EDGE_PX);
            // The decisive relation, whatever the numbers are tuned to later.
            expect(input.sample.targetSize).toBeLessThan(input.poster.targetSize);
            expect(input.sample.maxEdgePx).toBeLessThan(input.poster.maxEdgePx);
            expect(input.sample.quality).toBeLessThan(input.poster.quality);
        });

        it('never encodes a sample frame better than the poster it sits beside', async () => {
            // VERY_HIGH puts the media's own quality (40) UNDER the sample constant (45), so the
            // throwaway frames would otherwise come out sharper than the tile people see.
            const input = await captureFrameInput('VERY_HIGH');

            expect(input.sample.quality).toBeLessThanOrEqual(input.poster.quality);
        });
    });
});
