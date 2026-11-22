jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {}, stripeWebhookSecret: '' }));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));
jest.mock('@repo/backend-lib/utils', () => ({
  ...jest.requireActual('@repo/backend-lib/utils'),
  QueueHelper: { createComputeUserMetricsJob: jest.fn().mockResolvedValue(undefined) },
}));

import { logService } from '@repo/backend-lib/config/logging';
import { consoleLogger } from 'src/common/testing/console-logger';
import { JOB_RECORD_MEDIA_MODERATION } from '@repo/common-lib/constants/queues';
import { PERMANENT_BAN_THRESHOLD, STRIKES_TO_BAN } from '@repo/common-lib/constants/limits';
import { AiProcessor } from './ai.processor';

const REASON = 'SECRETMODERATIONREASON the model described the image';

const build = (extra: { account_strikes: number; ban_count: number }, row: Record<string, unknown>) => {
  const lines: any[] = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
    });
  }
  jest.spyOn(logService, 'api').mockImplementation((cfg = {}) => consoleLogger(cfg));
  const moderation = { id: 77, is_allowed: true, severity: 1, reason: REASON, ...row };
  const deps = {
    mediaModerationRepository: { create: jest.fn().mockResolvedValue(moderation) },
    userExtraDataService: {
      findOneByUserId: jest.fn().mockResolvedValue({ id: 3, ...extra }),
      update: jest.fn().mockResolvedValue(undefined),
    },
    mailService: { send: jest.fn().mockResolvedValue(undefined) },
    userAccountBannedMail: { setUser: jest.fn().mockReturnValue({}) },
    userService: {
      banUser: jest.fn().mockResolvedValue(undefined),
      findOneCompacted: jest.fn().mockResolvedValue({ id: 9, language: 'EN', email: 'victim@example.com' }),
    },
    planSubscriptionsService: { cancel: jest.fn().mockResolvedValue(undefined) },
  };
  const processor = new AiProcessor(
    {} as never,
    deps.mediaModerationRepository as never,
    deps.userExtraDataService as never,
    deps.mailService as never,
    {} as never,
    deps.userAccountBannedMail as never,
    deps.userService as never,
    deps.planSubscriptionsService as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { emit: jest.fn() } as never,
  );
  return { processor, lines, deps };
};

const jobOf = (data: Record<string, unknown> = {}): any => ({
  id: 'm1',
  name: JOB_RECORD_MEDIA_MODERATION,
  queueName: 'ai',
  attemptsMade: 0,
  opts: { attempts: 3 },
  data: { user_id: 9, media_id: 41, ...data },
});

const named = (lines: any[], message: string) => lines.filter((l) => l.message === message);

describe('AiProcessor moderation lines', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC-29: an allowed moderation logs "Moderation recorded" with only the listed keys and no strike', async () => {
    const { processor, lines } = build({ account_strikes: 0, ban_count: 0 }, {});
    await processor.process(jobOf());
    const [line] = named(lines, 'Moderation recorded');
    expect(line.extraInfo).toEqual({ user_id: 9, moderation_id: 77, is_allowed: true, severity: 1, media_id: 41 });
    expect(line.operation).toBe('moderate-content');
    expect(line.extraInfo.user_id).toBe(9);
    expect(named(lines, 'Content rejected by moderation')).toHaveLength(0);
  });

  it('AC-29: a disallowed moderation logs warn "Content rejected by moderation" with the strike count', async () => {
    const { processor, lines } = build({ account_strikes: 0, ban_count: 0 }, { is_allowed: false, severity: 6 });
    await processor.process(jobOf());
    const [line] = named(lines, 'Content rejected by moderation');
    expect(line.level).toBe('WARN');
    expect(line.extraInfo).toEqual({ user_id: 9, moderation_id: 77, severity: 6, account_strikes: 1 });
    expect(named(lines, 'Account ban applied')).toHaveLength(0);
  });

  it('AC-29: reaching STRIKES_TO_BAN logs warn "Account ban applied" {ban_count, permanent:false}', async () => {
    const { processor, lines, deps } = build({ account_strikes: STRIKES_TO_BAN - 1, ban_count: 0 }, { is_allowed: false });
    await processor.process(jobOf());
    const [line] = named(lines, 'Account ban applied');
    expect(line.level).toBe('WARN');
    expect(line.extraInfo).toMatchObject({ ban_count: 1, permanent: false });
    expect(typeof line.extraInfo.ban_lift).toBe('string');
    expect(deps.userService.banUser).not.toHaveBeenCalled();
  });

  it('AC-29: the permanent ban threshold logs permanent:true', async () => {
    const { processor, lines, deps } = build(
      { account_strikes: STRIKES_TO_BAN - 1, ban_count: PERMANENT_BAN_THRESHOLD - 1 },
      { is_allowed: false },
    );
    await processor.process(jobOf());
    expect(named(lines, 'Account ban applied')[0].extraInfo).toMatchObject({ permanent: true });
    expect(deps.planSubscriptionsService.cancel).toHaveBeenCalledWith(9);
  });

  it('AC-29: no line carries the moderation reason, the row or the user email', async () => {
    const { processor, lines } = build({ account_strikes: STRIKES_TO_BAN - 1, ban_count: 0 }, { is_allowed: false });
    await processor.process(jobOf());
    const dumped = JSON.stringify(lines.filter((l) => l.channel === 'ai'));
    expect(dumped).not.toMatch(/SECRETMODERATIONREASON|victim@example\.com|"reason"/);
  });

  it('AC-29: the moderation message strings are constants', async () => {
    const { processor, lines } = build({ account_strikes: STRIKES_TO_BAN - 1, ban_count: 0 }, { is_allowed: false });
    await processor.process(jobOf());
    for (const line of lines.filter((l) => l.operation === 'moderate-content')) {
      expect(line.message).not.toMatch(/\d/);
    }
  });
});
