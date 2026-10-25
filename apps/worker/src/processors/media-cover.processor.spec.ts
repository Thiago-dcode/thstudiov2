import { Job } from 'bullmq';
import { QueueHelper } from '@repo/backend-lib/utils';
import { UserLimits } from '@repo/common-lib/utils/user-limits';
import { MediaProcessor } from './media.processor';

/**
 * The cover is `previews[0]`, and it stays that whether the artist picked it at upload or changed
 * it later — billing, `storageBytes` and the SEO rename all lean on that alias.
 */
describe('MediaProcessor video cover', () => {
    const PREVIOUS_COVER = 'users/u/media/m/hero-preview-0.webp';
    const SAMPLES = ['users/u/media/m/hero-preview-1.webp', 'users/u/media/m/hero-preview-2.webp'];

    const finishedVideo = {
        id: 21,
        public_id: 'd5cda095-c43f-4df5-bbea-e0d292188c26',
        user_id: 2,
        media_type: 'VIDEO' as const,
        status: 'COMPLETED' as const,
        completed_at: new Date('2026-10-01T10:00:00.000Z'),
        blocked_at: null,
        url: 'users/u/media/m/hero.mp4',
        thumbnail: PREVIOUS_COVER,
        thumbnail_bytes: 90_000,
        previews: [PREVIOUS_COVER, ...SAMPLES],
        previews_bytes: 108_000,
        thumbnail_time_seconds: null,
    };

    const frame = (size: number, seekSeconds: number) => ({
        filename: 'f.webp',
        size,
        buffer: Buffer.alloc(4),
        reencoded: true,
        seekSeconds,
    });

    beforeEach(() => {
        // Every one of these opens a real BullMQ Redis connection and hangs the run.
        jest.spyOn(QueueHelper, 'createOrUpdateUserNotificationJob').mockResolvedValue(undefined);
        jest.spyOn(QueueHelper, 'createStorageRequestJob').mockResolvedValue(undefined);
        jest.spyOn(QueueHelper, 'createComputeUserMetricsJob').mockResolvedValue(undefined);
        jest.spyOn(QueueHelper, 'createUpdateProfileStatusJob').mockResolvedValue(undefined);
        jest.spyOn(UserLimits, 'storageSize').mockReturnValue(true);
        jest.spyOn(QueueHelper, 'createDeleteReplacedMediaObjectJob').mockResolvedValue(undefined);
        jest.spyOn(QueueHelper, 'createInvalidateMediaSeoCacheJob').mockResolvedValue(undefined);
        jest.spyOn(QueueHelper, 'createPurgeArtistEdgeCacheJob').mockResolvedValue(undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    const buildLogger = () => {
        const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        return { name: () => log, flushAsync: jest.fn() } as any;
    };

    describe('at upload', () => {
        const run = async (thumbnail_time_seconds: number | null) => {
            const uploading = {
                ...finishedVideo,
                status: 'UPLOADING' as const,
                completed_at: null,
                compression_level: 'HIGH' as const,
                url: 'users/u/media/m/hero.source.mp4',
                thumbnail_time_seconds,
            };
            const compressService = {
                config: { driver: 'sharp' },
                getSizeCompressed: jest.fn().mockReturnValue(20_000_000),
                extractVideoFrames: jest
                    .fn()
                    .mockResolvedValue([frame(90_000, 3.2), frame(9_000, 0.4), frame(9_000, 2)]),
                optimizeVideo: jest.fn().mockResolvedValue({
                    filename: 'hero.mp4',
                    // Under PREVIEW_TARGET_BYTES, so the video is its own preview.
                    size: 4_000_000,
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
            const mediaRepository = {
                findOneByColumn: jest.fn().mockResolvedValue(uploading),
                updateById: jest.fn().mockResolvedValue({ ...finishedVideo }),
            };
            const processor = new MediaProcessor(
                {
                    data: { media: uploading, generate_metadata: false },
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
                mediaRepository as any,
                { findByUserId: jest.fn().mockResolvedValue({ storage_used_mb: 0 }) } as any,
                {
                    findUserActivePlan: jest.fn().mockResolvedValue(null),
                    findFreePlan: jest.fn().mockResolvedValue({ name: 'Free' }),
                } as any,
                buildLogger(),
            );

            await processor.processMedia();

            const [input] = compressService.extractVideoFrames.mock.calls[0]!;
            const completed = mediaRepository.updateById.mock.calls.find(
                ([, data]) => data.status === 'COMPLETED',
            )?.[1];
            return { input, completed };
        };

        it('asks for the picked second and stores where the frame was really taken', async () => {
            const { input, completed } = await run(3.25);

            expect(input.posterSeconds).toBe(3.25);
            // The extractor's clamped second, not the request: the editor reopens on it.
            expect(completed.thumbnail_time_seconds).toBe(3.2);
            expect(completed.thumbnail).toBe(completed.previews[0]);
        });

        it('leaves the column null when nothing was picked', async () => {
            const { input, completed } = await run(null);

            expect(input.posterSeconds).toBeUndefined();
            expect(completed.thumbnail_time_seconds).toBeNull();
        });
    });

    describe('changing it later', () => {
        const build = ({
            row = finishedVideo as Record<string, unknown> | null,
            latest,
            isAllowed = true,
            attempts = 1,
            attemptsMade = 0,
        }: {
            row?: Record<string, unknown> | null;
            latest?: Record<string, unknown>;
            isAllowed?: boolean;
            attempts?: number;
            attemptsMade?: number;
        } = {}) => {
            const storageService = {
                exists: jest.fn().mockResolvedValue(true),
                getBuffer: jest.fn().mockResolvedValue(Buffer.alloc(64)),
                write: jest.fn().mockResolvedValue(true),
                delete: jest.fn().mockResolvedValue(true),
                getUrl: jest.fn().mockResolvedValue('https://cdn.test/cover'),
            };
            const compressService = {
                extractVideoFrameAt: jest.fn().mockResolvedValue(frame(70_000, 4.5)),
                getImageShape: jest.fn().mockResolvedValue('LANDSCAPE'),
                getImageAspectRatio: jest.fn().mockResolvedValue('16:9'),
            };
            const aiService = {
                moderateContent: jest.fn().mockResolvedValue({
                    moderation: { is_allowed: isAllowed, severity: isAllowed ? 0 : 9, reason: 'x' },
                }),
            };
            const mediaRepository = {
                findOneByColumn: jest
                    .fn()
                    .mockResolvedValueOnce(row)
                    .mockResolvedValueOnce(latest ?? row)
                    .mockResolvedValue(row),
                updateById: jest.fn().mockResolvedValue({}),
            };
            const processor = new MediaProcessor(
                {
                    name: 'set-video-thumbnail',
                    data: { media_id: 21, thumbnail_time_seconds: 4.5 },
                    opts: { attempts },
                    attemptsMade,
                } as unknown as Job,
                storageService as any,
                compressService as any,
                aiService as any,
                mediaRepository as any,
                {} as any,
                {} as any,
                buildLogger(),
            );
            return { processor, storageService, compressService, mediaRepository };
        };

        it('swaps previews[0] for the new frame and keeps the byte sum honest', async () => {
            const { processor, storageService, mediaRepository } = build();

            await processor.setVideoThumbnail();

            const [, update] = mediaRepository.updateById.mock.calls[0]!;
            // A new versioned key — the CDN serves the old one as immutable.
            expect(update.thumbnail).toMatch(/^users\/u\/media\/m\/hero-preview-0-[0-9a-f]{8}\.webp$/);
            expect(update.previews).toEqual([update.thumbnail, ...SAMPLES]);
            expect(update.thumbnail_bytes).toBe(70_000);
            expect(update.previews_bytes).toBe(108_000 - 90_000 + 70_000);
            expect(update.thumbnail_time_seconds).toBe(4.5);
            // An orphan now, but caches still hand its key out: deleted later, never on the spot.
            expect(storageService.delete).not.toHaveBeenCalled();
            const [scheduled, delayMs] = (QueueHelper.createDeleteReplacedMediaObjectJob as jest.Mock)
                .mock.calls[0]!;
            expect(scheduled).toEqual({ media_id: 21, path: PREVIOUS_COVER });
            // Outlives the day-long SEO metadata cache that serves `og:image` by path.
            expect(delayMs).toBeGreaterThan(24 * 60 * 60 * 1000);
            expect(QueueHelper.createInvalidateMediaSeoCacheJob).toHaveBeenCalledWith({
                public_id: finishedVideo.public_id,
            });
            expect(QueueHelper.createStorageRequestJob).toHaveBeenCalledWith({
                path: update.thumbnail,
                bytes: 70_000,
                user_id: 2,
            });
            // The new cover is on the artist's public pages: their edge cache is purged.
            expect(QueueHelper.createPurgeArtistEdgeCacheJob).toHaveBeenCalledWith({ user_id: 2 });
        });

        it('still finishes the cover change when the edge purge cannot be enqueued', async () => {
            (QueueHelper.createPurgeArtistEdgeCacheJob as jest.Mock).mockRejectedValueOnce(
                new Error('redis down'),
            );
            const { processor, mediaRepository } = build();

            await expect(processor.setVideoThumbnail()).resolves.toBeUndefined();

            expect(mediaRepository.updateById).toHaveBeenCalled();
        });

        it('keeps the old cover when moderation refuses the frame, and still answers the editor', async () => {
            const { processor, storageService, mediaRepository } = build({ isAllowed: false });

            await processor.setVideoThumbnail();

            expect(mediaRepository.updateById).not.toHaveBeenCalled();
            const writtenKey = storageService.write.mock.calls[0]![1];
            expect(storageService.delete).toHaveBeenCalledWith(writtenKey);
            expect(storageService.delete).not.toHaveBeenCalledWith(PREVIOUS_COVER);
            expect(QueueHelper.createOrUpdateUserNotificationJob).toHaveBeenCalled();
            // Nothing public changed.
            expect(QueueHelper.createPurgeArtistEdgeCacheJob).not.toHaveBeenCalled();
        });

        it('backs off when the cover moved while the frame was being encoded', async () => {
            const { processor, storageService, mediaRepository } = build({
                latest: {
                    ...finishedVideo,
                    thumbnail: 'users/u/media/renamed-preview-0.webp',
                    previews: ['users/u/media/renamed-preview-0.webp', ...SAMPLES],
                },
            });

            await processor.setVideoThumbnail();

            expect(mediaRepository.updateById).not.toHaveBeenCalled();
            expect(storageService.delete).not.toHaveBeenCalledWith(PREVIOUS_COVER);
        });

        it('retries rather than racing an edit or the AI metadata run on the same row', async () => {
            const { processor, compressService, mediaRepository } = build({
                row: { ...finishedVideo, status: 'GENERATING_METADATA' },
                attempts: 6,
            });

            await expect(processor.setVideoThumbnail()).rejects.toThrow(/busy/);
            expect(compressService.extractVideoFrameAt).not.toHaveBeenCalled();
            expect(mediaRepository.updateById).not.toHaveBeenCalled();
        });

        it('removes its frame and retries when the row turns busy mid-run', async () => {
            const { processor, storageService, mediaRepository } = build({
                latest: { ...finishedVideo, status: 'UPDATING' },
                attempts: 6,
            });

            await expect(processor.setVideoThumbnail()).rejects.toThrow(/busy/);
            const writtenKey = storageService.write.mock.calls[0]![1];
            expect(storageService.delete).toHaveBeenCalledWith(writtenKey);
            expect(mediaRepository.updateById).not.toHaveBeenCalled();
        });

        it('settles on the last attempt: keeps the cover and tells the waiting editor', async () => {
            const { processor, mediaRepository } = build({
                row: { ...finishedVideo, status: 'UPDATING' },
                attempts: 6,
                attemptsMade: 5,
            });

            await expect(processor.setVideoThumbnail()).resolves.toBeUndefined();
            expect(mediaRepository.updateById).not.toHaveBeenCalled();
            expect(QueueHelper.createOrUpdateUserNotificationJob).toHaveBeenCalled();
        });

        it('never schedules the old cover for deletion when the change is refused', async () => {
            const { processor } = build({ isAllowed: false });

            await processor.setVideoThumbnail();

            expect(QueueHelper.createDeleteReplacedMediaObjectJob).not.toHaveBeenCalled();
            expect(QueueHelper.createInvalidateMediaSeoCacheJob).not.toHaveBeenCalled();
        });

        it('skips anything that is not a finished video', async () => {
            const { processor, compressService, mediaRepository } = build({
                row: { ...finishedVideo, media_type: 'IMAGE' },
            });

            await processor.setVideoThumbnail();

            expect(compressService.extractVideoFrameAt).not.toHaveBeenCalled();
            expect(mediaRepository.updateById).not.toHaveBeenCalled();
        });
    });
});

describe('MediaProcessor.deleteReplacedObject', () => {
    const PATH = 'users/u/media/m/hero-preview-0.webp';

    const run = async (row: Record<string, unknown> | null) => {
        const storageService = { delete: jest.fn().mockResolvedValue(true) };
        const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        const processor = new MediaProcessor(
            {
                name: 'delete-replaced-media-object',
                data: { media_id: 21, path: PATH },
            } as unknown as Job,
            storageService as any,
            {} as any,
            {} as any,
            { findOneByColumn: jest.fn().mockResolvedValue(row) } as any,
            {} as any,
            {} as any,
            { name: () => log, flushAsync: jest.fn() } as any,
        );
        await processor.deleteReplacedObject();
        return storageService;
    };

    it('deletes a key the media no longer points at', async () => {
        const storage = await run({
            id: 21,
            url: 'users/u/media/m/hero.mp4',
            thumbnail: 'users/u/media/m/hero-preview-0-abcd1234.webp',
            previews: ['users/u/media/m/hero-preview-0-abcd1234.webp'],
            video_preview: null,
        });

        expect(storage.delete).toHaveBeenCalledWith(PATH);
    });

    it('leaves a key alone that any column references again', async () => {
        const storage = await run({
            id: 21,
            url: 'users/u/media/m/hero.mp4',
            thumbnail: 'users/u/media/m/other.webp',
            previews: ['users/u/media/m/other.webp', PATH],
            video_preview: null,
        });

        expect(storage.delete).not.toHaveBeenCalled();
    });

    it('still removes the orphan when the media itself is gone', async () => {
        const storage = await run(null);

        expect(storage.delete).toHaveBeenCalledWith(PATH);
    });
});
