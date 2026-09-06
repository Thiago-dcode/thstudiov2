import { Job } from 'bullmq';
import { QueueHelper } from '@repo/backend-lib/utils';
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
        overrides: { storage?: Record<string, unknown> } = {},
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
        const job = { data: { media, generate_metadata: false } } as unknown as Job;

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
            }),
        );
        expect(storageService.delete).toHaveBeenCalled();
    });
});
