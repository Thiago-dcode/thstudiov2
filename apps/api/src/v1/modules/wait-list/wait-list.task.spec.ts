jest.mock('src/common/utils/cron-lock', () => ({
  CRON_LOCK_TTL: { daily: 1 },
  runCronExclusive: async (_name: string, _ttl: number, job: () => Promise<void>) => {
    await job();
    return true;
  },
}));

jest.mock('@repo/common-lib/config/utils', () => ({
  getConfigValue: () => ({ url: 'https://a11studio.test' }),
}));

import type { MailService } from '@repo/backend-lib/services/mail-service';
import type { LogService } from '@repo/backend-lib/services/log-service';
import type { WaitList } from '@repo/common-lib/types/wait-list';
import type { WaitListFollowUpMail } from './mails/wait-list-follow-up.mail';
import type { WaitListReminderMail } from './mails/wait-list-reminder.mail';
import type { WaitListRepository } from './wait-list.repository';
import type { WaitListService } from './wait-list.service';
import { WaitListTask } from './wait-list.task';

type Call = { method: string; args: unknown[] };

/** Records every repository/service/mail call (the lint setup here cannot type `jest.fn`). */
const createTask = (dueFollowUps: Partial<WaitList>[] = [], dueInviteCount = 0) => {
  const calls: Call[] = [];
  const record = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args });
  };

  const repository = {
    findWaitingDueForFollowUp: async (...args: unknown[]) => {
      record('findWaitingDueForFollowUp')(...args);
      return dueFollowUps;
    },
    countWaitingValidatedBefore: async (...args: unknown[]) => {
      record('countWaitingValidatedBefore')(...args);
      return dueInviteCount;
    },
    updateById: async (...args: unknown[]) => record('updateById')(...args),
  };
  const service = { inviteBatch: async (...args: unknown[]) => record('inviteBatch')(...args) };
  const followUpMail = { setData: (...args: unknown[]) => ({ followUp: args }) };
  const mailService = { sendAsync: async (...args: unknown[]) => record('sendAsync')(...args) };
  const logger = { info: () => undefined, warn: () => undefined, error: () => undefined, flushAsync: async () => undefined };

  const task = new WaitListTask(
    repository as unknown as WaitListRepository,
    service as unknown as WaitListService,
    {} as WaitListReminderMail,
    followUpMail as unknown as WaitListFollowUpMail,
    mailService as unknown as MailService,
    logger as unknown as LogService,
  );

  const argsOf = (method: string) => calls.filter((call) => call.method === method).map((call) => call.args);
  const order = () => calls.map((call) => call.method);

  return { task, argsOf, order };
};

const iso = (value: unknown) => (value as Date).toISOString();

describe('WaitListTask.handleWaitListInvites', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ['on schedule', '2026-10-14T11:00:00.051Z'],
    ['fired late', '2026-10-14T11:28:13.000Z'],
  ])('derives disjoint follow-up / invite windows from the 11:00 anchor (%s)', async (_label, now) => {
    jest.useFakeTimers({ now: new Date(now) });
    const { task, argsOf } = createTask([], 3);

    await task.handleWaitListInvites();

    const [[followUpAfter, followUpBefore, limit]] = argsOf('findWaitingDueForFollowUp');
    const [[inviteBefore]] = argsOf('countWaitingValidatedBefore');

    expect(iso(followUpAfter)).toBe('2026-10-12T11:00:00.000Z');
    expect(iso(followUpBefore)).toBe('2026-10-13T11:00:00.000Z');
    expect(limit).toBe(200);
    // Follow-up window starts exactly where the invite cutoff ends: nobody qualifies for both.
    expect(iso(inviteBefore)).toBe(iso(followUpAfter));
    expect(iso(argsOf('inviteBatch')[0][1])).toBe('2026-10-12T11:00:00.000Z');
  });

  it('sends each due follow-up, marks it, and runs before the invites', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-14T11:00:00Z') });
    const { task, argsOf, order } = createTask(
      [{ id: 7, email: 'a@test.com', language: 'ES' }],
      1,
    );

    await task.handleWaitListInvites();

    const [[mailable, options]] = argsOf('sendAsync');
    expect(mailable).toEqual({
      followUp: [{ email: 'a@test.com', showcaseUrl: 'https://a11studio.test/artists/thsworld' }, 'ES'],
    });
    expect(options).toEqual({ jobId: 'wait-list-follow-up-7' });

    const [[id, data]] = argsOf('updateById');
    expect(id).toBe(7);
    expect(data).toHaveProperty('follow_up_email_sent_at');

    expect(order().indexOf('sendAsync')).toBeLessThan(order().indexOf('countWaitingValidatedBefore'));
  });

  it('still queues invites when the follow-up step fails', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-14T11:00:00Z') });
    const { task, argsOf } = createTask([{ id: 7, email: 'a@test.com', language: 'EN' }], 2);
    // A send failure for one row must neither stop the invite step nor mark the row as sent.
    (task as unknown as { mailService: { sendAsync: () => Promise<never> } }).mailService.sendAsync = async () => {
      throw new Error('queue down');
    };

    await task.handleWaitListInvites();

    expect(argsOf('updateById')).toHaveLength(0);
    expect(argsOf('inviteBatch')[0][0]).toBe(2);
  });
});
