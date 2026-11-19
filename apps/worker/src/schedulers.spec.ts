const mockUpsert = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn().mockResolvedValue(undefined);
const mockQueueCtor = jest.fn();
jest.mock('bullmq', () => ({
  Queue: class {
    constructor(...args: unknown[]) {
      mockQueueCtor(...args);
    }
    upsertJobScheduler = (...args: unknown[]) => mockUpsert(...args);
    setGlobalConcurrency = jest.fn();
    close = () => mockClose();
  },
}));

import { JOB_FLUSH_LOGS, LOG_QUEUE } from '@repo/common-lib/constants/queues';
import { LOG_FLUSH_EVERY_MS, scheduleLogFlush } from './schedulers';

describe('scheduleLogFlush', () => {
  beforeEach(() => jest.clearAllMocks());

  it('AC-10: LOG_FLUSH_EVERY_MS is five seconds', () => {
    expect(LOG_FLUSH_EVERY_MS).toBe(5_000);
  });

  it('AC-10: upserts the JOB_FLUSH_LOGS scheduler on LOG_QUEUE with the exact options, then closes the queue', async () => {
    const connection = { url: 'redis://localhost:6379' };
    await scheduleLogFlush(connection);

    expect(mockQueueCtor).toHaveBeenCalledTimes(1);
    expect(mockQueueCtor).toHaveBeenCalledWith(LOG_QUEUE, { connection });
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      JOB_FLUSH_LOGS,
      { every: 5_000 },
      { name: JOB_FLUSH_LOGS, opts: { attempts: 1, removeOnComplete: true, removeOnFail: 100 } },
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('AC-10: the queue is closed even when the upsert fails', async () => {
    mockUpsert.mockRejectedValueOnce(new Error('redis down'));
    await expect(scheduleLogFlush({ url: 'redis://x' })).rejects.toThrow('redis down');
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
