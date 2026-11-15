const add = jest.fn();
const addBulk = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => ({ add, addBulk, close: jest.fn(), name })),
  QueueEvents: jest.fn(),
}));
jest.mock('@repo/common-lib/config', () => ({ config: () => ({ redis: { url: 'redis://stub' } }) }));
jest.mock('../services/log-service/factory-log.service', () => ({
  FactoryLogService: { createLogService: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
}));

import { runWithLogContext } from '../services/log-service/log-context';
import { LogService } from '../services/log-service/log.service';
import { MailService } from '../services/mail-service/mail.service';
import { QueueHelper } from './queue-helper';

const carrierId = (opts: any) => (opts?.telemetry?.metadata ? JSON.parse(opts.telemetry.metadata).id : null);

describe('AC-11: every enqueue carries the trace id', () => {
  beforeEach(() => {
    add.mockReset().mockResolvedValue({ id: 'j' });
    addBulk.mockReset().mockResolvedValue([]);
    (QueueHelper as any).mailQueue = null;
    jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('every QueueHelper.create* method called in context R passes a carrier with id R', async () => {
    const names = Object.getOwnPropertyNames(QueueHelper).filter(
      (n) => /^create/.test(n) && n !== 'createQueue' && typeof (QueueHelper as any)[n] === 'function',
    );
    expect(names.length).toBeGreaterThan(15);
    const dto = { user_id: 1, media_id: 1, id: 1, name: 'ERROR500MAIL', payload: {}, usernames: ['a'], ids: [1], email: 'a@b.c' };
    let called = 0;
    await runWithLogContext({ id: 'R' }, async () => {
      for (const name of names) {
        add.mockClear();
        addBulk.mockClear();
        try {
          const method = (QueueHelper as any)[name];
          await (name.endsWith('Jobs') ? method([dto]) : method(dto, dto, dto));
        } catch {
          // A method needing a richer dto may throw before enqueuing; it is checked only if it enqueued.
        }
        const opts = add.mock.calls[0]?.[2];
        const bulk = addBulk.mock.calls[0]?.[0];
        if (opts) {
          called++;
          expect({ name, id: carrierId(opts) }).toEqual({ name, id: 'R' });
        } else if (bulk) {
          called++;
          for (const job of bulk) expect({ name, id: carrierId(job.opts) }).toEqual({ name, id: 'R' });
        }
      }
    });
    expect(called).toBeGreaterThan(15);
  });

  it('outside a context no carrier is attached (opts unchanged)', async () => {
    await QueueHelper.createUserContactJob({ user_id: 1 } as any);
    expect(add.mock.calls[0][2].telemetry).toBeUndefined();
  });

  it('MailService.sendAsync and sendBatchAsync carry the trace id', async () => {
    const queue: any = { name: 'mail', add, addBulk };
    const mail: any = {
      envelope: async () => ({ from: 'a@b.c', to: 'd@e.f', subject: 's' }),
      content: async () => ({ text: 't', html: '<p>t</p>' }),
    };
    const service = new MailService({} as any, queue);
    await runWithLogContext({ id: 'R' }, async () => {
      await service.sendAsync(mail);
      await service.sendBatchAsync([mail, mail]);
    });
    expect(add.mock.calls.length + addBulk.mock.calls.length).toBeGreaterThanOrEqual(2);
    for (const call of add.mock.calls) expect(carrierId(call[2])).toBe('R');
    for (const call of addBulk.mock.calls) for (const job of call[0]) expect(carrierId(job.opts)).toBe('R');
  });
});
