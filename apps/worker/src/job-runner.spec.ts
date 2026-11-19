const mockHandle = jest.fn();
jest.mock('./processors/media.processor', () => ({ MediaProcessor: { handle: (job: unknown) => mockHandle(job) } }));
jest.mock('./processors/backup.processor', () => ({ BackupProcessor: { handle: jest.fn().mockResolvedValue({ status: 'done' }) } }));

import { logBuffer } from '@repo/backend-lib/config/logging';
import type { LogEntry } from '@repo/backend-lib/services/log-service';
import { JOB_FLUSH_LOGS, JOB_PROCESS_MEDIA, LOG_QUEUE, MEDIA_QUEUE } from '@repo/common-lib/constants/queues';
import { jobResolver, runWorkerJob } from './job-runner';

const fakeJob = (over: Record<string, unknown> = {}): any => ({
  id: 'w1',
  name: JOB_PROCESS_MEDIA,
  attemptsMade: 0,
  opts: { attempts: 3, telemetry: { metadata: JSON.stringify({ v: 1, id: 'REQ-UPLOAD' }) } },
  data: {},
  ...over,
});

describe('runWorkerJob', () => {
  let added: LogEntry[];
  beforeEach(() => {
    mockHandle.mockReset();
    added = [];
    jest.spyOn(logBuffer, 'add').mockImplementation((entry) => void added.push(entry));
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-14: runs the resolved handler; lifecycle lines carry the carrier id and the worker service', async () => {
    mockHandle.mockResolvedValue('ok');
    await expect(runWorkerJob(MEDIA_QUEUE, fakeJob())).resolves.toBe('ok');
    expect(added.map((e) => e.message)).toEqual(['Job started', 'Job completed']);
    expect(added[0]).toMatchObject({ service: 'worker', id: 'REQ-UPLOAD', channel: 'queue' });
    expect(added[0].extraInfo).toMatchObject({ job_id: 'w1', job_name: JOB_PROCESS_MEDIA, queue: MEDIA_QUEUE, attempt: 1 });
  });

  it('AC-14: an unknown job name still throws the same error', async () => {
    await expect(runWorkerJob(MEDIA_QUEUE, fakeJob({ name: 'nope' }))).rejects.toThrow(
      `Job name "nope" not recognized for queue "${MEDIA_QUEUE}"`,
    );
  });

  it('AC-14: an unknown queue throws too', async () => {
    await expect(runWorkerJob('other-queue', fakeJob())).rejects.toThrow('not recognized for queue "other-queue"');
  });

  it('AC-14: a job without a carrier logs with id null', async () => {
    await runWorkerJob(MEDIA_QUEUE, fakeJob({ opts: { attempts: 1 } }));
    expect(added[0].id).toBeNull();
  });

  it('AC-14: handler errors propagate unchanged and nothing is flushed', async () => {
    const flush = jest.spyOn(logBuffer, 'flush');
    const failure = new Error('ffmpeg exploded');
    mockHandle.mockRejectedValue(failure);
    await expect(runWorkerJob(MEDIA_QUEUE, fakeJob())).rejects.toBe(failure);
    expect(flush).not.toHaveBeenCalled();
  });

  it('the scheduled log flush job flushes the buffer once and writes no lifecycle lines', async () => {
    const flush = jest.spyOn(logBuffer, 'flush').mockResolvedValue(undefined);
    expect(jobResolver[LOG_QUEUE][JOB_FLUSH_LOGS]).toBeDefined();
    await runWorkerJob(LOG_QUEUE, fakeJob({ name: JOB_FLUSH_LOGS, opts: { attempts: 1 } }));
    expect(flush).toHaveBeenCalledTimes(1);
    expect(added).toEqual([]);
  });

  it('AC-11: jobResolver[LOG_QUEUE][JOB_FLUSH_LOGS] exists, so Object.keys(jobResolver) gives the worker a LOG_QUEUE consumer', () => {
    expect(typeof jobResolver[LOG_QUEUE][JOB_FLUSH_LOGS]).toBe('function');
    expect(Object.keys(jobResolver)).toContain(LOG_QUEUE);
  });

  it('AC-11: the flush job runs the real buffer flush once and writes no Job started/completed lines', async () => {
    const flush = jest.spyOn(logBuffer, 'flush').mockResolvedValue(undefined);
    await runWorkerJob(LOG_QUEUE, fakeJob({ name: JOB_FLUSH_LOGS, opts: { attempts: 1 } }));
    expect(flush).toHaveBeenCalledTimes(1);
    expect(added.filter((e) => /^Job (started|completed)/.test(e.message))).toEqual([]);
  });

  it('AC-12: a non-log queue still writes lifecycle lines with service worker and the carrier id, and never flushes', async () => {
    const flush = jest.spyOn(logBuffer, 'flush');
    mockHandle.mockResolvedValue('ok');
    await runWorkerJob(MEDIA_QUEUE, fakeJob());
    expect(added.map((e) => e.message)).toEqual(['Job started', 'Job completed']);
    for (const entry of added) expect(entry).toMatchObject({ service: 'worker', id: 'REQ-UPLOAD' });
    expect(flush).not.toHaveBeenCalled();
  });
});
