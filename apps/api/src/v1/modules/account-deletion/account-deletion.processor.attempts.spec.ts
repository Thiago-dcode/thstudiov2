jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {}, stripeWebhookSecret: '' }));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));

import { consoleLogger, consoleRequestService } from 'src/common/testing/console-logger';
import { JOB_DELETE_USER_ACCOUNT, JOB_SEND_ACCOUNT_DELETION_WARNING } from '@repo/common-lib/constants/queues';
import { AccountDeletionProcessor } from './account-deletion.processor';

const build = (throwing: boolean) => {
  const lines: any[] = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
    });
  }
  const logger = consoleLogger({ defaultOptions: { channel: 'account-deletion' } });
  const userRepository = {
    findById: jest.fn().mockImplementation(async () => {
      if (throwing) throw new Error('db down');
      return null;
    }),
    getDeletionState: jest.fn().mockResolvedValue(null),
  };
  const processor = new AccountDeletionProcessor(
    userRepository as never,
    { deleteAccount: jest.fn().mockResolvedValue({ deleted: false, reason: 'not-found' }) } as never,
    {} as never,
    {} as never,
    consoleRequestService(logger),
  );
  return { processor, lines };
};

const jobOf = (name: string, attempt: number, max = 3): any => ({
  id: 'ad-1',
  name,
  queueName: 'account-deletion',
  attemptsMade: attempt - 1,
  data: { user_id: 7 },
  opts: { attempts: max },
});

describe('AccountDeletionProcessor job failure alerting', () => {
  beforeEach(() => {
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC-28: a failure on attempt 1/3 logs error {will_retry:true}, no critical, with the user in extraInfo', async () => {
    const { processor, lines } = build(true);
    await expect(processor.process(jobOf('unknown-job', 1))).rejects.toThrow();
    expect(lines.filter((l) => l.level === 'CRITICAL')).toHaveLength(0);
    const failure = lines.find((l) => l.message === 'Account deletion job failed');
    expect(failure.level).toBe('ERROR');
    expect(failure.extraInfo.will_retry).toBe(true);
    expect(failure.extraInfo.user_id).toBe(7);
  });

  it('AC-28: a failure on attempt 3/3 logs exactly one critical "Account deletion job failed permanently"', async () => {
    const { processor, lines } = build(true);
    await expect(processor.process(jobOf('unknown-job', 3))).rejects.toThrow();
    const criticals = lines.filter((l) => l.level === 'CRITICAL');
    expect(criticals).toHaveLength(1);
    expect(criticals[0].message).toBe('Account deletion job failed permanently');
    expect(criticals[0].extraInfo.will_retry).toBe(false);
  });

  it('AC-28: an early return logs "Account deletion step skipped" with its reason', async () => {
    const { processor, lines } = build(false);
    await expect(processor.process(jobOf(JOB_SEND_ACCOUNT_DELETION_WARNING, 1))).resolves.toEqual({ sent: false, reason: 'not-flagged' });
    const skipped = lines.filter((l) => l.message === 'Account deletion step skipped');
    expect(skipped).toHaveLength(1);
    expect(skipped[0].level).toBe('INFO');
    expect(skipped[0].extraInfo).toMatchObject({ step: 'warning', reason: 'not-flagged' });
  });

  it('a hard-delete job is handed to UserService', async () => {
    const { processor } = build(false);
    await expect(processor.process(jobOf(JOB_DELETE_USER_ACCOUNT, 1))).resolves.toEqual({ deleted: false, reason: 'not-found' });
  });
});
