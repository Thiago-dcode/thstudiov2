const mockHandle = jest.fn();
jest.mock('./processors/media.processor', () => ({ MediaProcessor: { handle: (job: unknown) => mockHandle(job) } }));
jest.mock('./processors/backup.processor', () => ({ BackupProcessor: { handle: jest.fn().mockResolvedValue({ status: 'done' }) } }));

import { getLogContext } from '@repo/backend-lib/services/log-service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { JOB_PROCESS_MEDIA, MEDIA_QUEUE } from '@repo/common-lib/constants/queues';
import { runWorkerJob } from './job-runner';

const fakeJob = (over: Record<string, unknown> = {}): any => ({
  id: 'w1',
  name: JOB_PROCESS_MEDIA,
  attemptsMade: 0,
  opts: { attempts: 3, telemetry: { metadata: JSON.stringify({ v: 1, id: 'REQ-UPLOAD', c: { user_id: 4 } }) } },
  data: {},
  ...over,
});

describe('runWorkerJob', () => {
  beforeEach(() => {
    mockHandle.mockReset();
    jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-14: runs the resolved handler inside the context with the carrier id and job correlation', async () => {
    let seen: any;
    mockHandle.mockImplementation(async () => {
      seen = getLogContext();
      return 'ok';
    });
    await expect(runWorkerJob(MEDIA_QUEUE, fakeJob())).resolves.toBe('ok');
    expect(seen.id).toBe('REQ-UPLOAD');
    expect(seen.correlation).toMatchObject({ user_id: 4, job_id: 'w1', job_name: JOB_PROCESS_MEDIA, queue: MEDIA_QUEUE, attempt: 1 });
  });

  it('AC-14: an unknown job name still throws the same error', async () => {
    await expect(runWorkerJob(MEDIA_QUEUE, fakeJob({ name: 'nope' }))).rejects.toThrow(
      `Job name "nope" not recognized for queue "${MEDIA_QUEUE}"`,
    );
  });

  it('AC-14: an unknown queue throws too', async () => {
    await expect(runWorkerJob('other-queue', fakeJob())).rejects.toThrow('not recognized for queue "other-queue"');
  });

  it('AC-14: a job without a carrier runs with id null', async () => {
    let seen: any;
    mockHandle.mockImplementation(async () => {
      seen = getLogContext();
    });
    await runWorkerJob(MEDIA_QUEUE, fakeJob({ opts: { attempts: 1 } }));
    expect(seen.id).toBeNull();
  });

  it('AC-14: handler errors propagate unchanged and the logs are flushed in process', async () => {
    const failure = new Error('ffmpeg exploded');
    mockHandle.mockRejectedValue(failure);
    await expect(runWorkerJob(MEDIA_QUEUE, fakeJob())).rejects.toBe(failure);
    expect(LogService.flush).toHaveBeenCalled();
  });
});
