const mockHandle = jest.fn();
jest.mock('./processors/media.processor', () => ({
  ...jest.requireActual('./processors/media.processor'),
  MediaProcessor: { handle: (job: unknown) => mockHandle(job) },
}));
jest.mock('./processors/backup.processor', () => ({ BackupProcessor: { handle: jest.fn().mockResolvedValue({ status: 'done' }) } }));

import fs from 'node:fs';
import path from 'node:path';
import { logBuffer, type LogEntry } from '@repo/backend-lib/config/logging';
import { enqueueJob, jobLogContext, logPermanentJobFailure, readJobTrace } from '@repo/backend-lib/utils';
import { JOB_FLUSH_LOGS, JOB_PROCESS_MEDIA, LOG_QUEUE, MEDIA_QUEUE } from '@repo/common-lib/constants/queues';
import { runWorkerJob } from './job-runner';
import { workerLogger, workerTraceCarrier } from './logging';

const SECRET_DATA = { password: 'p4ss-secret', token: 'tok-secret', email: 'victim@example.com', media_id: 1 };

const fakeJob = (over: Record<string, unknown> = {}): any => ({
  id: 'w1',
  name: JOB_PROCESS_MEDIA,
  queueName: MEDIA_QUEUE,
  attemptsMade: 0,
  opts: { attempts: 3, telemetry: { metadata: JSON.stringify({ v: 1, id: 'REQ-1' }) } },
  data: SECRET_DATA,
  ...over,
});

const noTraceJob = () => fakeJob({ opts: { attempts: 1 } });

describe('worker logging', () => {
  let added: LogEntry[];
  beforeEach(() => {
    mockHandle.mockReset();
    added = [];
    jest.spyOn(logBuffer, 'add').mockImplementation((_logContext, entry) => void added.push(entry));
  });
  afterEach(() => jest.restoreAllMocks());

  describe('workerLogger (AC-16)', () => {
    it('AC-16: writes service worker, the channel and operation, the trace id and the job context as request', () => {
      const job = fakeJob();
      workerLogger('media', job, { operation: 'create' }).info('x', { media_id: 1 });

      expect(added).toHaveLength(1);
      expect(added[0]).toMatchObject({
        service: 'worker',
        channel: 'media',
        operation: 'create',
        id: 'REQ-1',
        level: 'INFO',
        message: 'x',
        extraInfo: { media_id: 1 },
      });
      expect(added[0].request).toEqual(jobLogContext(job));
      expect(added[0].request).toEqual({ queue: MEDIA_QUEUE, job_name: JOB_PROCESS_MEDIA, job_id: 'w1', attempt: 1, max_attempts: 3 });
    });

    it('AC-16: no value of job.data appears anywhere in the line, even when the line logs around it', () => {
      workerLogger('media', fakeJob(), { operation: 'create' }).error('failed', { media_id: 1 });
      const dumped = JSON.stringify(added);
      for (const secret of ['p4ss-secret', 'tok-secret', 'victim@example.com']) expect(dumped).not.toContain(secret);
      expect(Object.keys(added[0].request as object).sort()).toEqual(['attempt', 'job_id', 'job_name', 'max_attempts', 'queue']);
    });

    it('AC-16: without a job the line has no request key and id ""', () => {
      workerLogger('media').info('x');
      expect(added[0]).toMatchObject({ service: 'worker', channel: 'media', id: '', operation: null });
      expect(added[0]).not.toHaveProperty('request');
      workerLogger('media', null, { operation: 'create' }).info('y');
      expect(added[1]).not.toHaveProperty('request');
      expect(added[1]).toMatchObject({ operation: 'create', id: '' });
    });

    it('AC-16: a job without a trace keeps id "" but still has its request', () => {
      workerLogger('media', noTraceJob()).info('x');
      expect(added[0].id).toBe('');
      expect(added[0].request).toMatchObject({ job_id: 'w1' });
    });

    it('AC-16: a call-site operation overrides the logger default; the channel stays', () => {
      workerLogger('media', fakeJob(), { operation: 'create' }).info('x', { operation: 'other' });
      expect(added[0]).toMatchObject({ channel: 'media', operation: 'other' });
    });

    it('AC-16: each job has its own context: two loggers built for two jobs do not swap', () => {
      const a = workerLogger('media', fakeJob({ id: 'A' }));
      const b = workerLogger('media', fakeJob({ id: 'B', attemptsMade: 2, opts: { attempts: 5, telemetry: { metadata: JSON.stringify({ v: 1, id: 'REQ-B' }) } } }));
      a.info('a');
      b.info('b');
      a.info('a2');
      expect(added.map((e) => [e.id, (e.request as { job_id: string }).job_id])).toEqual([
        ['REQ-1', 'A'],
        ['REQ-B', 'B'],
        ['REQ-1', 'A'],
      ]);
      expect(added[1].request).toMatchObject({ attempt: 3, max_attempts: 5 });
    });

    it('AC-16: the context follows the job when it is read (a retry advances the attempt)', () => {
      const job = fakeJob();
      const log = workerLogger('media', job);
      log.info('first');
      job.attemptsMade = 1;
      log.info('second');
      expect(added.map((e) => (e.request as { attempt: number }).attempt)).toEqual([1, 2]);
    });
  });

  describe('runWorkerJob lifecycle lines (AC-17)', () => {
    it('AC-17: Job started/completed are worker, queue, job, the carrier id and request = the job context', async () => {
      mockHandle.mockResolvedValue('ok');
      const job = fakeJob();
      await runWorkerJob(MEDIA_QUEUE, job);

      expect(added.map((e) => e.message)).toEqual(['Job started', 'Job completed']);
      for (const entry of added) {
        expect(entry).toMatchObject({ service: 'worker', channel: 'queue', operation: 'job', id: 'REQ-1' });
        expect(entry.request).toEqual(jobLogContext({ ...job, queueName: MEDIA_QUEUE }));
        expect(entry.extraInfo).toMatchObject({ queue: MEDIA_QUEUE, job_name: JOB_PROCESS_MEDIA, job_id: 'w1', attempt: 1 });
        expect(JSON.stringify(entry)).not.toMatch(/p4ss-secret|tok-secret|victim@example/);
      }
    });

    it('AC-17: a retried attempt writes the "will retry" warning with the second attempt in request', async () => {
      mockHandle.mockRejectedValue(new Error('boom'));
      await expect(runWorkerJob(MEDIA_QUEUE, fakeJob({ attemptsMade: 1 }))).rejects.toThrow('boom');
      const warning = added.find((e) => e.message === 'Job attempt failed');
      expect(warning).toMatchObject({ level: 'WARN', service: 'worker', channel: 'queue', operation: 'job', id: 'REQ-1' });
      expect(warning?.request).toMatchObject({ attempt: 2, max_attempts: 3 });
      expect(warning?.extraInfo).toMatchObject({ attempt: 2, will_retry: true });
    });

    it('AC-17: the request carries the queue the job came from, not "unknown"', async () => {
      mockHandle.mockResolvedValue(undefined);
      await runWorkerJob(MEDIA_QUEUE, fakeJob({ queueName: undefined }));
      expect((added[0].request as { queue: string }).queue).toBe(MEDIA_QUEUE);
    });

    it('AC-17: the LOG_QUEUE flush job still writes no lifecycle line', async () => {
      jest.spyOn(logBuffer, 'flush').mockResolvedValue(undefined);
      await runWorkerJob(LOG_QUEUE, fakeJob({ name: JOB_FLUSH_LOGS, opts: { attempts: 1 } }));
      expect(added).toEqual([]);
    });
  });

  describe('workerTraceCarrier (AC-18)', () => {
    it('AC-18: has exactly service, id and globalContext', () => {
      const carrier = workerTraceCarrier(fakeJob());
      expect(Object.keys(carrier).sort()).toEqual(['globalContext', 'id', 'service']);
      expect(carrier.service).toBe('worker');
      expect(carrier.id).toBe('REQ-1');
      expect(carrier).not.toHaveProperty('defaultOptions');
      expect(carrier).not.toHaveProperty('callback');
      expect(carrier).not.toHaveProperty('format');
    });

    it('AC-18: its globalContext is the job context and never holds job.data', () => {
      const job = fakeJob();
      const context = workerTraceCarrier(job).globalContext?.({} as never);
      expect(context).toEqual(jobLogContext(job));
      expect(JSON.stringify(context)).not.toMatch(/p4ss-secret|tok-secret|victim@example/);
    });

    it('AC-18: there is no globalContext without a job', () => {
      for (const carrier of [workerTraceCarrier(), workerTraceCarrier(null), workerTraceCarrier(undefined)]) {
        expect(Object.keys(carrier).sort()).toEqual(['id', 'service']);
        expect(carrier.service).toBe('worker');
        expect(carrier.id).toBeNull();
      }
    });

    it('AC-18: a job enqueued with its carrier carries the job trace id in opts.telemetry, and the line is worker/queue/enqueue', async () => {
      const add = jest.fn(async (name: string, _data: unknown, opts: unknown) => ({ id: 'n1', name, opts }));
      await enqueueJob({ name: 'media', add } as any, 'next-job', { a: 1 }, undefined, workerTraceCarrier(fakeJob()));

      expect(readJobTrace({ opts: add.mock.calls[0][2] as any })).toEqual({ id: 'REQ-1' });
      expect(added[0]).toMatchObject({ service: 'worker', channel: 'queue', operation: 'enqueue', id: 'REQ-1', message: 'Job enqueued' });
      expect(added[0].request).toMatchObject({ job_id: 'w1', queue: MEDIA_QUEUE });
    });

    it('AC-18: MediaProcessor.traceLog() hands every QueueHelper enqueue the worker carrier of its own job', async () => {
      const { MediaProcessor } = jest.requireActual('./processors/media.processor') as typeof import('./processors/media.processor');
      const { QueueHelper } = require('@repo/backend-lib/utils') as typeof import('@repo/backend-lib/utils');
      const purge = jest.spyOn(QueueHelper, 'createPurgeArtistEdgeCacheJob').mockResolvedValue(undefined as never);
      const logFor = jest.fn((operation: string) => workerLogger('media', fakeJob(), { operation }));
      const processor = new MediaProcessor(fakeJob(), {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, logFor);

      await (processor as any).requestEdgePurge(7, logFor('create'));

      const carrier = purge.mock.calls[0][1] as ReturnType<typeof workerTraceCarrier>;
      expect(Object.keys(carrier).sort()).toEqual(['globalContext', 'id', 'service']);
      expect(carrier).toMatchObject({ service: 'worker', id: 'REQ-1' });
      const add = jest.fn(async (name: string, _data: unknown, opts: unknown) => ({ id: 'n2', name, opts }));
      await enqueueJob({ name: 'edge', add } as any, 'purge', {}, undefined, carrier);
      expect(readJobTrace({ opts: add.mock.calls[0][2] as any })).toEqual({ id: 'REQ-1' });
    });

    it('AC-18: the failed handler: a permanent failure line is service worker, channel failed-job and carries the job trace id', async () => {
      const job = fakeJob({ attemptsMade: 3, failedReason: 'boom', stacktrace: [], queueQualifiedName: `bull:${MEDIA_QUEUE}` });
      await logPermanentJobFailure(job, new Error('boom'), 'active', workerTraceCarrier(job));

      expect(added).toHaveLength(1);
      expect(added[0]).toMatchObject({ service: 'worker', channel: 'failed-job', id: 'REQ-1', level: 'ERROR', message: 'Job failed permanently' });
      expect(added[0].operation).toBeNull();
      expect(added[0].request).toMatchObject({ job_id: 'w1', job_name: JOB_PROCESS_MEDIA });
    });

    // BullMQ increments attemptsMade BEFORE it emits `failed`, so in that event the job has
    // attemptsMade === the attempt that just failed (not the one before it).
    it('AC-18: failed event after the LAST attempt (attemptsMade === opts.attempts): request.attempt is opts.attempts, never one more', async () => {
      const job = fakeJob({ attemptsMade: 3, opts: { attempts: 3 }, failedReason: 'boom', stacktrace: [], queueQualifiedName: `bull:${MEDIA_QUEUE}` });
      await logPermanentJobFailure(job, new Error('boom'), 'active', workerTraceCarrier(job));
      expect(added).toHaveLength(1);
      expect(added[0].request).toMatchObject({ attempt: 3, max_attempts: 3 });
    });

    it('AC-18: failed event for an UnrecoverableError on the first attempt (attemptsMade 1 after the event): request.attempt is 1', async () => {
      const job = fakeJob({ attemptsMade: 1, opts: { attempts: 3 }, failedReason: 'bad input', stacktrace: [], queueQualifiedName: `bull:${MEDIA_QUEUE}` });
      const error = Object.assign(new Error('bad input'), { name: 'UnrecoverableError' });
      await logPermanentJobFailure(job, error, 'active', workerTraceCarrier(job));
      expect(added).toHaveLength(1);
      expect(added[0]).toMatchObject({ channel: 'failed-job', message: 'Job failed permanently' });
      expect(added[0].request).toMatchObject({ attempt: 1, max_attempts: 3 });
    });

    it('AC-18: a line written while the job runs shows the running attempt (attemptsMade + 1), on every attempt', async () => {
      for (const [attemptsMade, expected] of [[0, 1], [1, 2], [2, 3]] as const) {
        added.length = 0;
        const job = fakeJob({ attemptsMade });
        mockHandle.mockImplementationOnce(async () => workerLogger('media', job, { operation: 'create' }).info('inside the handler'));
        await runWorkerJob(MEDIA_QUEUE, job);
        const lines = added.filter((e) => e.service === 'worker');
        expect(lines.map((e) => e.message)).toEqual(['Job started', 'inside the handler', 'Job completed']);
        for (const line of lines) expect(line.request).toMatchObject({ attempt: expected, max_attempts: 3 });
      }
    });

    it('AC-18: a "failed" event with no job still writes under the worker service', async () => {
      await logPermanentJobFailure(undefined, new Error('stalled'), 'active', workerTraceCarrier(undefined));
      expect(added[0]).toMatchObject({ service: 'worker', channel: 'failed-job', id: '' });
      expect(added[0]).not.toHaveProperty('request');
    });

    it('AC-18: main.ts registers the failed handler with workerTraceCarrier(job)', () => {
      const main = fs.readFileSync(path.join(__dirname, 'main.ts'), 'utf8');
      expect(main).toMatch(/worker\.on\('failed',[^\n]*logPermanentJobFailure\(job, error, prev, workerTraceCarrier\(job\)\)/);
    });
  });
});
