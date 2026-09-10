import { Job } from 'bullmq';
import { QueueHelper } from '@repo/backend-lib/utils';
import { MediaInputError } from '@repo/backend-lib/services/compress-service/base';
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
});
