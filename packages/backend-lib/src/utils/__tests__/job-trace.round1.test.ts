const mockLoggers: Record<string, Record<string, jest.Mock>> = {};
jest.mock('../../config/logging', () => {
  const actual = jest.requireActual('../../config/logging');
  // Every factory hands its service and overrides to one mock, as the real ones build one config.
  const create = (_storage: unknown, cfg: { defaultOptions?: { channel: string } }) => {
      const channel = cfg.defaultOptions?.channel ?? 'system';
      mockLoggers[channel] ??= { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn(), flush: jest.fn().mockResolvedValue(undefined) };
      return mockLoggers[channel];
    };
  const factory = (service: string | null) => (overrides: Record<string, unknown> = {}) =>
    (create as (buffer: unknown, cfg: any) => unknown)(undefined, { service, ...overrides });
  return {
    ...actual,
    logService: { api: factory('api'), worker: factory('worker'), dbcli: factory('dbcli'), web: factory('web'), lib: factory(null) },
  };
});

import { enqueueJob, logPermanentJobFailure, redactJobData } from '../job-trace';

const queueLog = () => mockLoggers['queue'];
const failedLog = () => mockLoggers['failed-job'];

beforeEach(() => {
  for (const channel of Object.values(mockLoggers)) {
    Object.values(channel).forEach((fn) => fn.mockReset());
    channel.flush.mockResolvedValue(undefined);
  }
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('enqueueJob dedup message', () => {
  const queueReturning = (job: unknown) => ({ name: 'mail', add: jest.fn().mockResolvedValue(job) });
  const dedup = (jobId?: string) => ({ ...(jobId ? { jobId } : {}), deduplication: { id: 'critical-alert:abc', ttl: 1000 } }) as any;

  // BullMQ returns the job already holding the deduplication id, with a fresh timestamp.
  it('logs "Job deduplicated" when the returned job id differs from the requested jobId', async () => {
    const queue = queueReturning({ id: 'mail-existing', timestamp: Date.now() });
    await enqueueJob(queue as any, 'some-job', {}, dedup('mail-requested'));
    expect(queueLog().info.mock.calls[0][0]).toBe('Job deduplicated');
    expect(queueLog().info.mock.calls[0][1]).toEqual({
      queue: 'mail',
      job_name: 'some-job',
      job_id: 'mail-existing',
      deduplication_id: 'critical-alert:abc',
      operation: 'enqueue',
    });
  });

  it('logs "Job enqueued" when the returned id is the requested jobId, even with a deduplication id', async () => {
    const queue = queueReturning({ id: 'mail-requested', timestamp: Date.now() });
    await enqueueJob(queue as any, 'some-job', {}, dedup('mail-requested'));
    expect(queueLog().info.mock.calls[0][0]).toBe('Job enqueued');
  });

  it('compares ids as strings (numeric ids)', async () => {
    const queue = queueReturning({ id: 7, timestamp: Date.now() });
    await enqueueJob(queue as any, 'some-job', {}, dedup('7'));
    expect(queueLog().info.mock.calls[0][0]).toBe('Job enqueued');
  });

  it('logs "Job enqueued" without an explicit jobId (nothing to compare), whatever the returned job', async () => {
    const queue = queueReturning({ id: 'auto-1', timestamp: 1 });
    await enqueueJob(queue as any, 'some-job', {}, dedup());
    expect(queueLog().info.mock.calls[0][0]).toBe('Job enqueued');
  });

  it('logs "Job enqueued" when there is no deduplication, even if the ids differ', async () => {
    const queue = queueReturning({ id: 'other', timestamp: 1 });
    await enqueueJob(queue as any, 'some-job', {}, { jobId: 'mail-requested' } as any);
    expect(queueLog().info.mock.calls[0][0]).toBe('Job enqueued');
  });

  it('logs "Job enqueued" when the returned job has no id', async () => {
    const queue = queueReturning({});
    await enqueueJob(queue as any, 'some-job', {}, dedup('mail-requested'));
    expect(queueLog().info.mock.calls[0][0]).toBe('Job enqueued');
  });
});

describe('logPermanentJobFailure masking', () => {
  const failing = (over: Record<string, unknown> = {}): any => ({
    id: '1',
    name: 'send-mail',
    queueName: 'mail',
    queueQualifiedName: 'bull:mail',
    attemptsMade: 3,
    opts: { attempts: 3 },
    data: {
      to: 'ross@example.com',
      From: 'noreply@a11studio.com',
      cc: ['alice@ssl.example.org'],
      subject: 'SECRETSUBJECT Reset your password',
      html: '<b>SECRETBODY</b>',
      user: { email: 'nested@example.com', note: 'contact inline@example.com' },
      attempt: 1,
    },
    failedReason: 'Invalid to: ross@example.com',
    stacktrace: ['Error: 550 <alice@ssl.example.org>\n at send'],
    ...over,
  });
  const error = Object.assign(new Error('550 <ross@example.com> rejected'), { stack: 'Error: ross@example.com\n at x' });

  it('does not log data.to/from/cc/subject and masks addresses in failure text, the stack and the stacktrace', async () => {
    await logPermanentJobFailure(failing(), error, 'active');
    const [message, extra] = failedLog().error.mock.calls[0];
    expect(message).toBe('Job failed permanently');
    expect(extra.data.to).toBe('[redacted]');
    expect(extra.data.From).toBe('[redacted]');
    expect(extra.data.cc).toBe('[redacted]');
    expect(extra.data.subject).toBe('[redacted]');
    expect(extra.data.html).toBe('[redacted, 17 chars]');
    expect(extra.data.attempt).toBe(1);
    const dumped = JSON.stringify(failedLog().error.mock.calls);
    expect(dumped).not.toMatch(/@example\.com|@ssl\.example\.org|@a11studio\.com|SECRETSUBJECT|SECRETBODY/);
    expect(extra.failedReason).toBe('Invalid to: [email]');
    expect(extra.errorMessage).toBe('550 <[email]> rejected');
  });

  it('masks addresses in the no-job case too', async () => {
    await logPermanentJobFailure(undefined, error, 'active');
    const dumped = JSON.stringify(failedLog().error.mock.calls);
    expect(failedLog().error.mock.calls[0][0]).toBe('Queue worker failed with no job');
    expect(dumped).not.toContain('ross@example.com');
  });

  it('redactJobData masks a bare string, arrays of mail jobs and keeps non-address data', () => {
    expect(redactJobData('hi ross@example.com')).toBe('hi [email]');
    expect(redactJobData([{ to: 'a@b.co', n: 2 }])).toEqual([{ to: '[redacted]', n: 2 }]);
    expect(redactJobData({ user_id: 7, media: { id: 1 } })).toEqual({ user_id: 7, media: { id: 1 } });
    expect(redactJobData(null)).toBeNull();
  });
});
