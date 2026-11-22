import { createHash } from 'node:crypto';

const createMailJob = jest.fn();
const appConfig = { sendErrorEmails: true, errorEmailThrottleMinutes: 15, url: 'https://example.test' };

jest.mock('@repo/common-lib/config', () => ({
  config: () => ({ app: appConfig }),
}));
jest.mock('../queue-helper', () => ({ QueueHelper: { createMailJob } }));

import { JOB_ERROR_500_MAIL } from '@repo/common-lib/constants/queues';
import type { LogEntry } from '../../config/logging';
import { CRITICAL_ALERT_MAX_PER_WINDOW, criticalAlertMail, resetCriticalAlertThrottle } from '../critical-alert-mail';

const entry = (over: Partial<LogEntry> = {}): LogEntry => ({
  timestamp: '2026-11-14T12:00:00.000Z',
  service: 'api',
  replica: 'host-1',
  channel: 'api.error',
  operation: null,
  level: 'CRITICAL',
  id: 'req-1',
  message: 'db exploded',
  status_code: 500,
  extraInfo: { path: '/x' },
  ...over,
});

describe('criticalAlertMail', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    jest.setSystemTime(new Date('2026-11-14T12:00:00Z'));
    createMailJob.mockReset().mockResolvedValue(undefined);
    resetCriticalAlertThrottle();
    appConfig.sendErrorEmails = true;
    appConfig.errorEmailThrottleMinutes = 15;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('AC-19: sendErrorEmails=false returns before any enqueue', async () => {
    appConfig.sendErrorEmails = false;
    await criticalAlertMail(entry());
    expect(createMailJob).not.toHaveBeenCalled();
  });

  it('AC-19: sendErrorEmails=false does not consume throttle state', async () => {
    appConfig.sendErrorEmails = false;
    await criticalAlertMail(entry());
    appConfig.sendErrorEmails = true;
    await criticalAlertMail(entry());
    expect(createMailJob).toHaveBeenCalledTimes(1);
  });

  it('AC-19: the same fingerprint twice inside the window enqueues once', async () => {
    await criticalAlertMail(entry());
    await criticalAlertMail(entry({ replica: 'host-2', id: 'req-2', request: undefined, extraInfo: { path: '/other' } }));
    expect(createMailJob).toHaveBeenCalledTimes(1);
  });

  it('AC-19: the same fingerprint again after the window enqueues again', async () => {
    await criticalAlertMail(entry());
    jest.setSystemTime(new Date('2026-11-14T12:15:01Z'));
    await criticalAlertMail(entry());
    expect(createMailJob).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['channel', { channel: 'mail' } as Partial<LogEntry>],
    ['service', { service: 'worker' } as Partial<LogEntry>],
    ['operation', { operation: 'send-mail' } as Partial<LogEntry>],
    ['status_code', { status_code: 503 } as Partial<LogEntry>],
    ['message', { message: 'other failure' } as Partial<LogEntry>],
  ])('AC-19: a different %s is a different alert', async (_name, over) => {
    await criticalAlertMail(entry());
    await criticalAlertMail(entry(over));
    expect(createMailJob).toHaveBeenCalledTimes(2);
  });

  it('AC-19: throttle 0 sends every time and passes no deduplication option, only the trace id', async () => {
    appConfig.errorEmailThrottleMinutes = 0;
    await criticalAlertMail(entry());
    await criticalAlertMail(entry());
    expect(createMailJob).toHaveBeenCalledTimes(2);
    for (const call of createMailJob.mock.calls) {
      expect(call[1]).toBeUndefined();
      expect(call[2]).toEqual({ id: entry().id });
    }
  });

  it('AC-19: throttle 0 also disables the cap', async () => {
    appConfig.errorEmailThrottleMinutes = 0;
    for (let i = 0; i < CRITICAL_ALERT_MAX_PER_WINDOW + 5; i++) await criticalAlertMail(entry({ message: `m${i}` }));
    expect(createMailJob).toHaveBeenCalledTimes(CRITICAL_ALERT_MAX_PER_WINDOW + 5);
  });

  it('AC-19: the 11th distinct fingerprint in a window is capped, with one console.warn', async () => {
    const warn = console.warn as jest.Mock;
    expect(CRITICAL_ALERT_MAX_PER_WINDOW).toBe(10);
    for (let i = 0; i < 13; i++) await criticalAlertMail(entry({ message: `distinct ${i}` }));
    expect(createMailJob).toHaveBeenCalledTimes(10);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('AC-19: the cap resets when the window ends', async () => {
    for (let i = 0; i < 11; i++) await criticalAlertMail(entry({ message: `distinct ${i}` }));
    expect(createMailJob).toHaveBeenCalledTimes(10);
    jest.setSystemTime(new Date('2026-11-14T12:16:00Z'));
    await criticalAlertMail(entry({ message: 'after window' }));
    expect(createMailJob).toHaveBeenCalledTimes(11);
  });

  it('AC-19: a capped alert does not stay throttled forever (not recorded as sent)', async () => {
    for (let i = 0; i < 10; i++) await criticalAlertMail(entry({ message: `distinct ${i}` }));
    await criticalAlertMail(entry({ message: 'capped one' }));
    expect(createMailJob).toHaveBeenCalledTimes(10);
    jest.setSystemTime(new Date('2026-11-14T12:16:00Z'));
    await criticalAlertMail(entry({ message: 'capped one' }));
    expect(createMailJob).toHaveBeenCalledTimes(11);
  });

  it('AC-19: deduplication id and ttl match the fingerprint and the window', async () => {
    await criticalAlertMail(entry({ operation: 'send-mail' }));
    const [, opts] = createMailJob.mock.calls[0];
    const fingerprint = 'api|api.error|send-mail|500|db exploded';
    expect(opts.deduplication).toEqual({
      id: 'critical-alert:' + createHash('sha1').update(fingerprint).digest('hex'),
      ttl: 15 * 60 * 1000,
    });
  });

  it('AC-19: the fingerprint ignores replica and path (same id across replicas), includes service', async () => {
    await criticalAlertMail(entry({ replica: 'a', extraInfo: { path: '/1' } }));
    await criticalAlertMail(entry({ replica: 'b', extraInfo: { path: '/2' } }));
    await criticalAlertMail(entry({ service: 'worker' }));
    const ids = createMailJob.mock.calls.map((c) => c[1]?.deduplication.id);
    expect(createMailJob).toHaveBeenCalledTimes(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('AC-19: payload has the unchanged job name, subject and the entry fields', async () => {
    const e = entry({ operation: 'send-mail', message: 'x'.repeat(200), request: { id: 'req-1' } as any });
    await criticalAlertMail(e);
    const [job] = createMailJob.mock.calls[0];
    expect(job.name).toBe(JOB_ERROR_500_MAIL);
    expect(job.name).toBe('ERROR500MAIL');
    expect(job.payload.message).toBe(e.message);
    expect(job.payload.subject).toBe(`CRITICAL [api] api.error/send-mail: ${'x'.repeat(80)}`);
    expect(job.payload.options).toEqual({
      service: 'api',
      replica: 'host-1',
      channel: 'api.error',
      operation: 'send-mail',
      id: 'req-1',
      status_code: 500,
      timestamp: e.timestamp,
      request: e.request,
      extraInfo: e.extraInfo,
      app_url: 'https://example.test',
    });
  });

  it('AC-19: the subject omits the slash without an operation', async () => {
    await criticalAlertMail(entry());
    expect(createMailJob.mock.calls[0][0].payload.subject).toBe('CRITICAL [api] api.error: db exploded');
  });

  it('AC-19: a rejected createMailJob is swallowed and reported with console.error', async () => {
    createMailJob.mockRejectedValue(new Error('redis down'));
    await expect(criticalAlertMail(entry())).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it('AC-19: a failed enqueue does not stop later different alerts', async () => {
    createMailJob.mockRejectedValueOnce(new Error('redis down'));
    await criticalAlertMail(entry());
    await criticalAlertMail(entry({ message: 'second' }));
    expect(createMailJob).toHaveBeenCalledTimes(2);
  });

  it('AC-19: a multi-line / whitespace message gives a single-line subject of at most 80 message chars, body keeps the full message', async () => {
    const message = `  relation "plans"\n\tdoes not exist\r\n   at Foo.bar (/app/x.js:1:1)\n${'y'.repeat(200)}  `;
    await criticalAlertMail(entry({ message, operation: 'op' }));
    const { payload } = createMailJob.mock.calls[0][0];
    expect(payload.subject).not.toMatch(/[\r\n\t]/);
    expect(payload.subject).not.toMatch(/\s{2,}/);
    const prefix = 'CRITICAL [api] api.error/op: ';
    expect(payload.subject.startsWith(prefix + 'relation "plans" does not exist at Foo.bar')).toBe(true);
    expect(payload.subject.length - prefix.length).toBeLessThanOrEqual(80);
    expect(payload.message).toBe(message);
  });

  it('AC-19: an all-whitespace message does not break the subject', async () => {
    await criticalAlertMail(entry({ message: ' \n\t ' }));
    expect(createMailJob.mock.calls[0][0].payload.subject).not.toMatch(/[\r\n\t]/);
  });

  it('AC-19: after a rejected enqueue the same fingerprint in the same window is enqueued again', async () => {
    createMailJob.mockRejectedValueOnce(new Error('redis down'));
    await criticalAlertMail(entry());
    await criticalAlertMail(entry());
    expect(createMailJob).toHaveBeenCalledTimes(2);
    // Now it succeeded, so a third identical alert is throttled again.
    await criticalAlertMail(entry());
    expect(createMailJob).toHaveBeenCalledTimes(2);
  });

  it('AC-19: a rejected enqueue returns its cap slot (10 sent still allowed after a failure)', async () => {
    const warn = console.warn as jest.Mock;
    for (let i = 0; i < 9; i++) await criticalAlertMail(entry({ message: `ok ${i}` }));
    createMailJob.mockRejectedValueOnce(new Error('redis down'));
    await criticalAlertMail(entry({ message: 'fails' }));
    // 9 sent + 1 failed: without the returned slot this would be the capped 11th.
    await criticalAlertMail(entry({ message: 'tenth sent' }));
    expect(createMailJob).toHaveBeenCalledTimes(11);
    expect(warn).not.toHaveBeenCalled();
    // The cap itself still holds: 10 were actually sent.
    await criticalAlertMail(entry({ message: 'eleventh sent' }));
    expect(createMailJob).toHaveBeenCalledTimes(11);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('AC-19: a failed enqueue from a past window does not take a slot from the new window', async () => {
    let rejectLater: (e: Error) => void = () => undefined;
    createMailJob.mockImplementationOnce(() => new Promise((_res, rej) => { rejectLater = rej; }));
    const slow = criticalAlertMail(entry({ message: 'slow' }));
    jest.setSystemTime(new Date('2026-11-14T12:20:00Z'));
    for (let i = 0; i < 3; i++) await criticalAlertMail(entry({ message: `new window ${i}` }));
    rejectLater(new Error('late failure'));
    await slow;
    // New window sent 3; fill it to the cap and confirm exactly 10 are allowed (no over-release).
    for (let i = 3; i < 12; i++) await criticalAlertMail(entry({ message: `new window ${i}` }));
    expect(createMailJob).toHaveBeenCalledTimes(1 + 10);
  });

  it('AC-19: concurrent identical alerts enqueue once', async () => {
    createMailJob.mockImplementation(() => new Promise((r) => setTimeout(r, 10)));
    jest.useRealTimers();
    await Promise.all([criticalAlertMail(entry()), criticalAlertMail(entry()), criticalAlertMail(entry())]);
    expect(createMailJob).toHaveBeenCalledTimes(1);
  });

  it('AC-19: concurrent identical alerts where the first enqueue fails leave the fingerprint retryable', async () => {
    createMailJob.mockRejectedValueOnce(new Error('redis down'));
    await Promise.all([criticalAlertMail(entry()), criticalAlertMail(entry())]);
    expect(createMailJob).toHaveBeenCalledTimes(1);
    await criticalAlertMail(entry());
    expect(createMailJob).toHaveBeenCalledTimes(2);
  });
});
