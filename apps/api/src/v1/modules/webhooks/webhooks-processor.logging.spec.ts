const retrieve = jest.fn();
const list = jest.fn();
const cancel = jest.fn();
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { subscriptions: { retrieve, list, cancel } },
}));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Queue } from 'bullmq';
import { consoleLogger } from 'src/common/testing/console-logger';
import { WebhookProcessor } from './webhooks-processor.service';

const CREATED = 1_800_000_000;
const carrier = (id: string) => JSON.stringify({ v: 1, id, c: {} });

const subscription = (over: Record<string, unknown> = {}) => ({
  id: 'sub_1',
  object: 'subscription',
  status: 'active',
  customer: 'cus_1',
  cancel_at: null,
  cancel_at_period_end: false,
  default_payment_method: 'pm_1',
  metadata: { requestId: 'R', requestAt: String(CREATED - 5) },
  items: { data: [{ id: 'si_1', price: { id: 'price_1' }, current_period_start: 1, current_period_end: 2 }] },
  ...over,
});

const eventOf = (type: string, object: Record<string, unknown>, id = 'evt_1'): any => ({
  id,
  type,
  created: CREATED,
  request: { id: 'req_s' },
  data: { object },
});

const jobOf = (event: any, { attempt = 1, max = 5, traceId }: { attempt?: number; max?: number; traceId?: string } = {}): any => ({
  id: `stripe-${event.id}`,
  name: 'stripe-webhook',
  queueName: 'stripe-webhooks',
  attemptsMade: attempt - 1,
  data: event,
  opts: { attempts: max, ...(traceId ? { telemetry: { metadata: carrier(traceId) } } : {}) },
});

const build = (opts: { planPrice?: unknown; user?: unknown } = {}) => {
  const lines: any[] = [];
  const push = (spy: jest.SpyInstance) =>
    spy.mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
    });
  push(jest.spyOn(console, 'log'));
  push(jest.spyOn(console, 'warn'));
  push(jest.spyOn(console, 'error'));
  const logger = consoleLogger({ defaultOptions: { channel: 'webhooks', operation: 'stripe-webhook' } });
  const planSubscriptionService = {
    findActiveSubscription: jest.fn().mockResolvedValue(null),
    findLatestSubscription: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 9, stripe_id: 'sub_1', user_id: 7 }),
    update: jest.fn(),
    desactivateAllUserSubscriptions: jest.fn().mockResolvedValue(undefined),
    setFreeSubscription: jest.fn().mockResolvedValue({ id: 11 }),
  };
  const subscriptionQueue = { name: 'plan-subscriptions', add: jest.fn().mockResolvedValue({ id: 'ps-1' }) };
  const processor = new WebhookProcessor(
    planSubscriptionService as any,
    { findOneByStripeId: jest.fn().mockResolvedValue(opts.planPrice === undefined ? { id: 3, price: 10 } : opts.planPrice) } as any,
    { findOneByStripeId: jest.fn().mockResolvedValue(opts.user ?? { id: 7, stripe_customer_id: 'cus_1', email: 'victim@example.com', name: 'Ana' }) } as any,
    { redeem: jest.fn().mockResolvedValue(undefined) } as any,
    { deleteCached: jest.fn(), deleteManyCached: jest.fn().mockResolvedValue(undefined) } as any,
    { log: () => logger, traceCarrier: () => ({ service: 'api' }) } as any,
    subscriptionQueue as unknown as Queue,
  );
  return { processor, lines, planSubscriptionService, subscriptionQueue };
};

const wh = (lines: any[], message: string) => lines.filter((l) => l.channel === 'webhooks' && l.message === message);

describe('WebhookProcessor logging', () => {
  beforeEach(() => {
    retrieve.mockReset();
    list.mockReset().mockResolvedValue({ data: [] });
    cancel.mockReset().mockResolvedValue({});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC-24: the processor source never calls this.logger.name( or this.logger.id(', () => {
    const source = fs.readFileSync(path.join(__dirname, 'webhooks-processor.service.ts'), 'utf8');
    expect(source).not.toMatch(/this\.logger\.(name|id)\(/);
  });

  it('AC-24: a created subscription logs "Subscription synced from Stripe" with the event ids and the fresh trace id', async () => {
    const sub = subscription();
    retrieve.mockResolvedValue(sub);
    const { processor, lines } = build();
    await processor.process(jobOf(eventOf('customer.subscription.created', sub)));
    const [line] = wh(lines, 'Subscription synced from Stripe');
    expect(line.extraInfo).toMatchObject({ action: 'created', plan_subscription_id: 9, plan_price_id: 3, stripe_status: 'active', is_active: true });
    expect(line.extraInfo).toMatchObject({
      stripe_event_id: 'evt_1',
      stripe_event_type: 'customer.subscription.created',
      stripe_subscription_id: 'sub_1',
      stripe_customer_id: 'cus_1',
      user_id: 7,
    });
    expect(line.id).toBe('R');
  });

  it('AC-24: stale-metadata events keep the job trace id, not the metadata requestId', async () => {
    const sub = subscription({ metadata: { requestId: 'OLD', requestAt: String(CREATED - 90 * 86400) } });
    retrieve.mockResolvedValue(sub);
    const { processor, lines } = build();
    await processor.process(jobOf(eventOf('customer.subscription.updated', sub), { traceId: 'HTTP-9' }));
    expect(wh(lines, 'Subscription synced from Stripe')[0].id).toBe('HTTP-9');
  });

  it('AC-24: concurrent events keep their own ids on the shared logger', async () => {
    const subA = subscription({ id: 'sub_A', metadata: {} });
    const subB = subscription({ id: 'sub_B', metadata: {} });
    retrieve.mockImplementation(async (id: string) => {
      await new Promise((r) => setTimeout(r, id === 'sub_A' ? 25 : 5));
      return id === 'sub_A' ? subA : subB;
    });
    const { processor, lines } = build();
    await Promise.all([
      processor.process(jobOf(eventOf('customer.subscription.created', subA, 'evt_A'), { traceId: 'TRACE-A' })),
      processor.process(jobOf(eventOf('customer.subscription.created', subB, 'evt_B'), { traceId: 'TRACE-B' })),
    ]);
    const synced = wh(lines, 'Subscription synced from Stripe');
    expect(synced).toHaveLength(2);
    for (const line of synced) {
      const expected = line.extraInfo.stripe_event_id === 'evt_A' ? 'TRACE-A' : 'TRACE-B';
      expect(line.id).toBe(expected);
      expect(line.extraInfo.stripe_subscription_id).toBe(line.extraInfo.stripe_event_id === 'evt_A' ? 'sub_A' : 'sub_B');
    }
    // A later event with no trace of its own must not inherit either id.
    const later = await (async () => {
      const sub = subscription({ id: 'sub_C', metadata: {} });
      retrieve.mockResolvedValue(sub);
      await processor.process(jobOf(eventOf('customer.subscription.created', sub, 'evt_C')));
      return wh(lines, 'Subscription synced from Stripe').find((l) => l.extraInfo.stripe_event_id === 'evt_C');
    })();
    expect(typeof later.id).toBe('string');
    expect(later.id).not.toMatch(/^TRACE-/);
  });

  it('AC-24: a live status different from the event status logs the stale-snapshot line', async () => {
    retrieve.mockResolvedValue(subscription({ status: 'canceled' }));
    const { processor, lines } = build();
    await processor.process(jobOf(eventOf('customer.subscription.updated', subscription({ status: 'active' }))));
    const [line] = wh(lines, 'Stripe event snapshot stale; applied live state');
    expect(line.extraInfo).toMatchObject({ event_status: 'active', live_status: 'canceled' });
    const [ignored] = wh(lines, 'Stripe webhook event ignored');
    expect(ignored.extraInfo).toMatchObject({ reason: 'inactive_without_match', stripe_status: 'canceled' });
  });

  it('AC-24: an unmapped price logs error "No plan price for Stripe price" and the job rejects', async () => {
    retrieve.mockResolvedValue(subscription());
    const { processor, lines } = build({ planPrice: null });
    await expect(processor.process(jobOf(eventOf('customer.subscription.created', subscription())))).rejects.toThrow('No plan price for Stripe price');
    const [line] = wh(lines, 'No plan price for Stripe price');
    expect(line.level).toBe('ERROR');
    expect(line.extraInfo).toMatchObject({ stripe_price_id: 'price_1' });
  });

  it('AC-24: two other active Stripe subscriptions give one "Duplicate Stripe subscriptions cancelled" {count:2}', async () => {
    retrieve.mockResolvedValue(subscription());
    list.mockResolvedValue({ data: [{ id: 'sub_1' }, { id: 'sub_X' }, { id: 'sub_Y' }] });
    const { processor, lines } = build();
    await processor.process(jobOf(eventOf('customer.subscription.created', subscription())));
    const dup = wh(lines, 'Duplicate Stripe subscriptions cancelled');
    expect(dup).toHaveLength(1);
    expect(dup[0].extraInfo).toMatchObject({ count: 2, stripe_subscription_ids: ['sub_X', 'sub_Y'] });
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('AC-24: no duplicate line when there are none', async () => {
    retrieve.mockResolvedValue(subscription());
    list.mockResolvedValue({ data: [{ id: 'sub_1' }] });
    const { processor, lines } = build();
    await processor.process(jobOf(eventOf('customer.subscription.created', subscription())));
    expect(wh(lines, 'Duplicate Stripe subscriptions cancelled')).toHaveLength(0);
  });

  it('AC-24: an unhandled event type logs "Stripe webhook event ignored" {unhandled_type}', async () => {
    const { processor, lines } = build();
    await processor.process(jobOf(eventOf('charge.refunded', { object: 'charge', id: 'ch_1' })));
    const [line] = wh(lines, 'Stripe webhook event ignored');
    expect(line.extraInfo).toMatchObject({ reason: 'unhandled_type' });
    expect(line.level).toBe('INFO');
  });

  it('AC-24: invoice.payment_failed logs warn with attempt_count', async () => {
    const { processor, lines } = build();
    await processor.process(
      jobOf(eventOf('invoice.payment_failed', { object: 'invoice', id: 'in_1', customer: 'cus_1', amount_due: 1000, currency: 'eur', attempt_count: 2, billing_reason: 'subscription_cycle', next_payment_attempt: 1 })),
    );
    const [line] = wh(lines, 'Stripe invoice payment failed');
    expect(line.level).toBe('WARN');
    expect(line.extraInfo).toMatchObject({ attempt_count: 2, amount_due: 1000, currency: 'eur' });
    expect(line.extraInfo.stripe_invoice_id).toBe('in_1');
  });

  it('AC-24: a handler throw on attempt 1/5 logs error {will_retry:true} and no critical', async () => {
    retrieve.mockRejectedValue(new Error('stripe 500'));
    const { processor, lines } = build();
    await expect(processor.process(jobOf(eventOf('customer.subscription.updated', subscription()), { attempt: 1, max: 5 }))).rejects.toThrow('stripe 500');
    expect(lines.filter((l) => l.level === 'CRITICAL')).toHaveLength(0);
    const [line] = wh(lines, 'Stripe webhook processing failed');
    expect(line.level).toBe('ERROR');
    expect(line.extraInfo).toMatchObject({ will_retry: true, error_message: 'stripe 500', error_name: 'Error' });
  });

  it('AC-24: a handler throw on attempt 5/5 logs exactly one critical "Stripe webhook processing failed permanently"', async () => {
    retrieve.mockRejectedValue(new Error('stripe 500'));
    const { processor, lines } = build();
    await expect(processor.process(jobOf(eventOf('customer.subscription.updated', subscription()), { attempt: 5, max: 5 }))).rejects.toThrow();
    const criticals = lines.filter((l) => l.level === 'CRITICAL');
    expect(criticals).toHaveLength(1);
    expect(criticals[0].message).toBe('Stripe webhook processing failed permanently');
    expect(criticals[0].extraInfo.will_retry).toBe(false);
    expect(lines.filter((l) => l.level === 'ERROR' && l.channel === 'webhooks')).toHaveLength(0);
  });

  it('AC-24: no line carries a Stripe object, items, the user row or an email', async () => {
    retrieve.mockResolvedValue(subscription());
    list.mockResolvedValue({ data: [{ id: 'sub_X' }] });
    const { processor, lines } = build();
    await processor.process(jobOf(eventOf('customer.subscription.created', subscription())));
    await processor.process(jobOf(eventOf('invoice.paid', { object: 'invoice', id: 'in_1', customer: 'cus_1', amount_paid: 1, currency: 'eur', billing_reason: 'x' }), { attempt: 1 }));
    const dumped = JSON.stringify(lines.filter((l) => l.channel === 'webhooks'));
    expect(dumped).not.toMatch(/"object":"subscription"|"items"|victim@example\.com|"email"|"surname"/);
  });
});
