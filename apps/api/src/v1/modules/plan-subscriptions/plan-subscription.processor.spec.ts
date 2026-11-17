jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {}, stripeWebhookSecret: '' }));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));

import * as fs from 'node:fs';
import * as path from 'node:path';
import { LogService, configureLogProcess } from '@repo/backend-lib/services/log-service';
import { ConsoleLogService } from '@repo/backend-lib/services/log-service';
import { JOB_ON_SUBSCRIPTION_CHANGES } from '@repo/common-lib/constants/queues';
import { PlanSubscriptionProcessor } from './plan-subscription.processor';

const data = {
  id: 7,
  email: 'victim@example.com',
  name: 'Ana',
  surname: 'Lopez',
  prevPlanId: 2,
  prevPlanName: 'Pro',
  prevPlanBasePrice: 10,
};

const jobOf = (attempt: number, max = 3): any => ({
  id: 'ps-1',
  name: JOB_ON_SUBSCRIPTION_CHANGES,
  queueName: 'plan-subscriptions',
  attemptsMade: attempt - 1,
  data,
  opts: { attempts: max },
});

const build = (planService: unknown) => {
  const lines: any[] = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
    });
  }
  const logger = new ConsoleLogService({ channel: 'plan-subscriptions', name: 'on-subscription-changes' });
  const nameSpy = jest.spyOn(logger, 'name');
  const processor = new PlanSubscriptionProcessor(
    logger as unknown as LogService,
    planService as any,
    { findOneByUserId: jest.fn() } as any,
    { deleteManyCached: jest.fn().mockResolvedValue(undefined) } as any,
    {} as any,
    {} as any,
    { emit: jest.fn() } as any,
  );
  return { processor, lines, nameSpy };
};

describe('PlanSubscriptionProcessor logging', () => {
  beforeEach(() => {
    configureLogProcess({ service: 'api' });
    jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    configureLogProcess({ service: '', onCritical: null });
  });

  it('AC-25: the source never calls this.logger.name(', () => {
    const source = fs.readFileSync(path.join(__dirname, 'plan-subscription.processor.ts'), 'utf8');
    expect(source).not.toMatch(/this\.logger\.name\(/);
  });

  it('AC-25: the data line carries user_id correlation and prev_plan_id, and never the user row', async () => {
    const { processor, lines, nameSpy } = build({ findUserActivePlan: jest.fn().mockResolvedValue(null) });
    await expect(processor.process(jobOf(1))).rejects.toThrow();
    const [line] = lines.filter((l) => l.message === 'Processing subscription changes');
    expect(line.correlation.user_id).toBe(7);
    expect(line.extraInfo).toEqual({ prev_plan_id: 2 });
    expect(line.operation).toBe('on-subscription-changes');
    const dumped = JSON.stringify(lines.filter((l) => l.channel === 'plan-subscriptions'));
    expect(dumped).not.toMatch(/victim@example\.com|"email"|"name":"Ana"|Lopez|"surname"/);
    expect(nameSpy).not.toHaveBeenCalled();
  });

  it('AC-25: a failure on attempt 1/3 logs error with will_retry and no critical', async () => {
    const { processor, lines } = build({ findUserActivePlan: jest.fn().mockResolvedValue(null) });
    await expect(processor.process(jobOf(1, 3))).rejects.toThrow('does not have an active plan');
    expect(lines.filter((l) => l.level === 'CRITICAL')).toHaveLength(0);
    const failure = lines.find((l) => l.message === 'Subscription change processing failed');
    expect(failure.level).toBe('ERROR');
    expect(failure.extraInfo.will_retry).toBe(true);
  });

  it('AC-25: a failure on attempt 3/3 logs exactly one critical', async () => {
    const { processor, lines } = build({ findUserActivePlan: jest.fn().mockResolvedValue(null) });
    await expect(processor.process(jobOf(3, 3))).rejects.toThrow();
    const criticals = lines.filter((l) => l.level === 'CRITICAL');
    expect(criticals).toHaveLength(1);
    expect(criticals[0].message).toBe('Subscription change processing failed permanently');
    expect(criticals[0].extraInfo.will_retry).toBe(false);
  });
});
