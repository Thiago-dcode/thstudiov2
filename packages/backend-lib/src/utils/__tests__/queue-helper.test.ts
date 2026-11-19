const add = jest.fn();
const close = jest.fn();
const addBulk = jest.fn();
const queueNames: string[] = [];

// No Redis: every `new Queue` is a stub recording what was added to it.
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => {
    queueNames.push(name);
    return { add, close, addBulk, name };
  }),
  QueueEvents: jest.fn(),
}));
jest.mock('@repo/common-lib/config', () => ({
  config: () => ({ redis: { url: 'redis://stub' } }),
}));

import { EDGE_PURGE_DEBOUNCE_MS } from '@repo/common-lib/constants/edge-cache';
import { EDGE_CACHE_QUEUE, JOB_PURGE_ARTIST_EDGE_CACHE, MAIL_QUEUE } from '@repo/common-lib/constants/queues';
import { QueueHelper } from '../queue-helper';

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

describe('QueueHelper.createMailJob', () => {
  beforeEach(() => {
    add.mockReset().mockResolvedValue(undefined);
    close.mockReset().mockResolvedValue(undefined);
    queueNames.length = 0;
  });

  const job = { name: 'ERROR500MAIL', payload: { message: 'm', options: {} } } as any;

  it('AC-20: passes deduplication into the job options when given', async () => {
    await QueueHelper.createMailJob(job, { deduplication: { id: 'critical-alert:abc', ttl: 900000 } });
    const [name, data, opts] = add.mock.calls[0];
    expect(name).toBe('ERROR500MAIL');
    expect(data).toEqual(job.payload);
    expect(opts.deduplication).toEqual({ id: 'critical-alert:abc', ttl: 900000 });
    expect(opts.attempts).toBe(3);
  });

  it('reuses one mail Queue across calls instead of opening a connection per call', async () => {
    (QueueHelper as any).mailQueue = null;
    await QueueHelper.createMailJob(job);
    await QueueHelper.createMailJob(job);
    await QueueHelper.createMailJob(job, { deduplication: { id: 'x', ttl: 1 } });
    expect(queueNames.filter((n) => n === MAIL_QUEUE)).toHaveLength(1);
    expect(add).toHaveBeenCalledTimes(3);
  });

  it('AC-20: callers without options are unchanged (no deduplication key)', async () => {
    await QueueHelper.createMailJob(job);
    const opts = add.mock.calls[0][2];
    expect('deduplication' in opts).toBe(false);
    expect(opts).toEqual(expect.objectContaining({ priority: 10, removeOnComplete: true, attempts: 3 }));
    expect(opts.jobId).toMatch(/^mail-ERROR500MAIL-/);
  });
});
