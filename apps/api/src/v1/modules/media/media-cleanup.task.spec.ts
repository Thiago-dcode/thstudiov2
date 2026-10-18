jest.mock('src/common/utils/cron-lock', () => ({
  CRON_LOCK_TTL: { hourly: 1 },
  runCronExclusive: async (_name: string, _ttl: number, job: () => Promise<void>) => {
    await job();
    return true;
  },
}));

/** Job states by job id; anything absent has no job at all. */
const jobStates = new Map<string, string>();

jest.mock('@repo/backend-lib/utils', () => ({
  QueueHelper: {
    createQueue: () => ({
      getJob: async (id: string) =>
        jobStates.has(id) ? { getState: async () => jobStates.get(id) } : undefined,
      close: async () => undefined,
    }),
  },
}));

import type { LogService } from '@repo/backend-lib/services/log-service';
import type { Media } from '@repo/common-lib/types/media';
import { MediaCleanupTask } from './media-cleanup.task';
import type { MediaRepository } from './media.repository';
import type { MediaService } from './media.service';

type StaleMedia = Pick<Media, 'id' | 'user_id' | 'public_id'>;

/** Records which media reached the service delete (the lint setup here cannot type `jest.fn`). */
const createTask = (candidates: StaleMedia[], stillStale = true) => {
  const deleteCalls: number[] = [];
  const repository = { findStaleProcessing: async () => candidates };
  const service = {
    deleteStaleProcessing: async (media: StaleMedia) => {
      deleteCalls.push(media.id);
      return stillStale;
    },
  };
  const scoped = { info: () => undefined, error: () => undefined };
  const logger = { name: () => scoped, flushAsync: async () => undefined };

  const task = new MediaCleanupTask(
    repository as unknown as MediaRepository,
    service as unknown as MediaService,
    logger as unknown as LogService,
  );
  return { task, deleteCalls };
};

const media = (id: number): StaleMedia => ({ id, user_id: 2, public_id: `public-${id}` });

describe('MediaCleanupTask', () => {
  beforeEach(() => jobStates.clear());

  it('removes stale media that no queue is working on', async () => {
    const { task, deleteCalls } = createTask([media(1), media(2)]);

    await task.handleStaleMediaCleanup();

    expect(deleteCalls).toEqual([1, 2]);
  });

  it.each(['waiting', 'active', 'delayed', 'prioritized'])(
    'keeps a media whose job is still %s',
    async (state: string) => {
      jobStates.set('process-media-1', state);
      const { task, deleteCalls } = createTask([media(1), media(2)]);

      await task.handleStaleMediaCleanup();

      expect(deleteCalls).toEqual([2]);
    },
  );

  it('keeps a media with a live job in any media queue, not only the upload one', async () => {
    jobStates.set('update-media-1', 'active');
    jobStates.set('generate-media-metadata-2', 'waiting');
    const { task, deleteCalls } = createTask([media(1), media(2)]);

    await task.handleStaleMediaCleanup();

    expect(deleteCalls).toEqual([]);
  });

  it('treats a settled job as gone', async () => {
    jobStates.set('process-media-1', 'failed');
    jobStates.set('process-media-2', 'completed');
    const { task, deleteCalls } = createTask([media(1), media(2)]);

    await task.handleStaleMediaCleanup();

    expect(deleteCalls).toEqual([1, 2]);
  });
});
