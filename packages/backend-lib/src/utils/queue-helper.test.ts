const add = jest.fn();
const close = jest.fn();
const queueNames: string[] = [];

// No Redis: every `new Queue` is a stub recording what was added to it.
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => {
    queueNames.push(name);
    return { add, close };
  }),
  QueueEvents: jest.fn(),
}));
jest.mock('@repo/common-lib/config', () => ({
  config: () => ({ redis: { url: 'redis://stub' } }),
}));

import { EDGE_PURGE_DEBOUNCE_MS } from '@repo/common-lib/constants/edge-cache';
import { EDGE_CACHE_QUEUE, JOB_PURGE_ARTIST_EDGE_CACHE } from '@repo/common-lib/constants/queues';
import { QueueHelper } from './queue-helper';

describe('QueueHelper.createPurgeArtistEdgeCacheJob', () => {
  beforeEach(() => {
    add.mockReset().mockResolvedValue(undefined);
    close.mockReset().mockResolvedValue(undefined);
    queueNames.length = 0;
  });

  it('debounces per artist with deduplication, on the edge-cache queue', async () => {
    await QueueHelper.createPurgeArtistEdgeCacheJob({ user_id: 7, usernames: ['ana'] });

    expect(queueNames).toEqual([EDGE_CACHE_QUEUE]);
    const [name, data, opts] = add.mock.calls[0];
    expect(name).toBe(JOB_PURGE_ARTIST_EDGE_CACHE);
    expect(data).toEqual({ user_id: 7, usernames: ['ana'] });
    expect(opts).toEqual(
      expect.objectContaining({
        delay: EDGE_PURGE_DEBOUNCE_MS,
        deduplication: {
          id: 'edge-purge-artist-7',
          // Equal to the delay: the key has expired by the time the job can be active, so a
          // trigger during an active purge creates a new job instead of being dropped.
          ttl: EDGE_PURGE_DEBOUNCE_MS,
          extend: true,
          replace: true,
        },
        attempts: 4,
        backoff: { type: 'exponential', delay: 20_000 },
        removeOnComplete: true,
        removeOnFail: true,
      }),
    );
  });

  it('gives every enqueue its own job id, never the deterministic one', async () => {
    await QueueHelper.createPurgeArtistEdgeCacheJob({ user_id: 7 });
    await QueueHelper.createPurgeArtistEdgeCacheJob({ user_id: 7 });

    const [first, second] = add.mock.calls.map(([, , opts]) => opts.jobId as string);
    expect(first).toMatch(/^edge-purge-artist-7-/);
    expect(second).toMatch(/^edge-purge-artist-7-/);
    expect(first).not.toBe(second);
    expect(first).not.toBe('edge-purge-artist-7');
  });

  it('closes its queue connection, also when the add fails', async () => {
    add.mockRejectedValueOnce(new Error('redis down'));

    await expect(QueueHelper.createPurgeArtistEdgeCacheJob({ user_id: 7 })).rejects.toThrow('redis down');
    expect(close).toHaveBeenCalledTimes(1);
  });
});
