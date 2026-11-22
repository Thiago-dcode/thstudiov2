const add = jest.fn();
const addBulk = jest.fn();
const close = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => ({ add, addBulk, close, name })),
  QueueEvents: jest.fn(),
}));
jest.mock('@repo/common-lib/config', () => ({
  config: () => ({ redis: { url: 'redis://stub' } }),
}));
jest.mock('../critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import fs from 'node:fs';
import path from 'node:path';
import { QueueHelper } from '../queue-helper';
import type { LogTraceCarrier } from '../job-trace';

const carriedId = (opts: any): string | null => {
  const raw = opts?.telemetry?.metadata;
  return raw ? (JSON.parse(raw).id ?? null) : null;
};

describe('AC-19: QueueHelper forwards the trailing log config', () => {
  beforeEach(() => {
    add.mockReset().mockResolvedValue({ id: 'j1' });
    addBulk.mockReset().mockResolvedValue([{ id: 'j1' }]);
    close.mockReset().mockResolvedValue(undefined);
    (QueueHelper as any).mailQueue = null;
  });

  it('AC-19: createMailJob(dto, undefined, { id: "T" }) carries "id":"T" in opts.telemetry.metadata', async () => {
    await QueueHelper.createMailJob({ name: 'ERROR500MAIL', payload: { message: 'm', options: {} } } as any, undefined, { id: 'T' });
    const [, , opts] = add.mock.calls[0];
    expect(opts.telemetry.metadata).toContain('"id":"T"');
  });

  it('AC-8: a LogTraceCarrier (service, id, globalContext) is accepted and its id is carried', async () => {
    const carrier: LogTraceCarrier = { service: 'api', id: () => 'CARRIED', globalContext: () => ({ path: '/x' }) };
    await QueueHelper.createMailJob({ name: 'ERROR500MAIL', payload: { message: 'm', options: {} } } as any, undefined, carrier);
    expect(carriedId(add.mock.calls[0][2])).toBe('CARRIED');
  });

  it('AC-19: without a log config no trace id is attached', async () => {
    await QueueHelper.createMailJob({ name: 'ERROR500MAIL', payload: { message: 'm', options: {} } } as any);
    expect(carriedId(add.mock.calls[0][2])).toBeNull();
  });

  it('AC-19: a function id is resolved when the job is enqueued', async () => {
    await QueueHelper.createUserContactJob({ user_id: 1 } as any, { id: () => 'FN' });
    expect(carriedId(add.mock.calls[0][2])).toBe('FN');
  });

  it('AC-19: other single-job methods forward it as well', async () => {
    await QueueHelper.createLlmUsageJob({} as any, { id: 'A' });
    await QueueHelper.createComputeUserMetricsJob(5, { id: 'B' });
    await QueueHelper.createPurgeArtistEdgeCacheJob({ user_id: 7, usernames: ['ana'] } as any, { id: 'C' });
    expect(add.mock.calls.map((c) => carriedId(c[2]))).toEqual(['A', 'B', 'C']);
  });

  it('AC-19: the bulk method forwards it to every job', async () => {
    addBulk.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    await QueueHelper.createRegenerateMediaThumbnailJobs([{ media_id: 1 }, { media_id: 2 }] as any, { id: 'BULK' });
    const jobs = addBulk.mock.calls[0][0] as { opts: unknown }[];
    expect(jobs).toHaveLength(2);
    expect(jobs.map((j) => carriedId(j.opts))).toEqual(['BULK', 'BULK']);
  });

  it('AC-8: every enqueueing static method declares a trailing `log: LogTraceCarrier = {}`', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'queue-helper.ts'), 'utf8');
    const methods = source.split(/\n\s+static /).slice(1);
    const enqueuing = methods.filter((m) => /enqueueJobs?\(/.test(m));
    expect(enqueuing.length).toBeGreaterThan(15);
    for (const m of enqueuing) {
      const name = m.match(/^(?:async )?(\w+)/)?.[1];
      expect({ name, hasLog: /log: LogTraceCarrier = \{\}/.test(m) }).toEqual({ name, hasLog: true });
      expect({ name, forwarded: /enqueueJobs?\([\s\S]*?\blog\b/.test(m) }).toEqual({ name, forwarded: true });
    }
  });
});
