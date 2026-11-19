const mockStripe = {
  checkout: { sessions: { create: jest.fn() } },
  subscriptions: { retrieve: jest.fn(), update: jest.fn() },
  paymentMethods: { list: jest.fn() },
  billingPortal: { sessions: { create: jest.fn() } },
};
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: mockStripe,
  stripeWebhookSecret: '',
}));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));
jest.mock('@repo/common-lib/config/utils', () => {
  const actual = jest.requireActual('@repo/common-lib/config/utils');
  return { ...actual, getConfigValue: (key: string) => (key === 'app' ? { url: 'https://app.test' } : actual.getConfigValue(key)) };
});

import { LogService } from '@repo/backend-lib/services/log-service';
import { runWithTraceId } from 'src/common/services/request-storage';
import { consoleLogger } from 'src/common/testing/console-logger';
import { PlanSubscriptionsService } from './plan-subscriptions.service';

const EMAIL = 'victim@example.com';
const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_SECRETLINK';
const PORTAL_URL = 'https://billing.stripe.com/p/session/SECRETPORTAL';

const user = { id: 9, email: EMAIL, name: 'Ana', stripe_customer_id: 'cus_1' };

const cardError = (statusCode: number, rawType = 'card_error', over: Record<string, unknown> = {}) =>
  Object.assign(new Error('Your card was declined.'), {
    type: statusCode >= 500 ? 'StripeAPIError' : 'StripeCardError',
    statusCode,
    raw: { type: statusCode >= 500 ? 'api_error' : rawType, code: 'card_declined', decline_code: 'generic_decline', headers: { authorization: 'Bearer sk_SECRETKEY' } },
    ...over,
  });

const build = () => {
  const lines: any[] = [];
  const stray: unknown[] = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { stray.push(line); }
    });
  }
  const logger = consoleLogger({ channel: 'plan-subscriptions' });
  const nameSpy = jest.spyOn(logger, 'name');
  const requestService = { user };
  const userBenefitsService = {
    redeemed: jest.fn().mockResolvedValue(false),
    getByIdAndUser: jest.fn().mockResolvedValue({ id: 5, trial_days: 7, active: true }),
  };
  const planSubscriptionsRepository = { findActiveSubscription: jest.fn(), findLatestSubscription: jest.fn() };
  const paymentMethodsService = { getOne: jest.fn().mockResolvedValue({ enabled: true }) };
  const planPriceService = { findOne: jest.fn() };
  const helpers = { deleteManyCached: jest.fn().mockResolvedValue(undefined), cacheRemember: jest.fn() };
  const service = new PlanSubscriptionsService(
    logger as unknown as LogService,
    planSubscriptionsRepository as any,
    planPriceService as any,
    requestService as any,
    {} as any,
    paymentMethodsService as any,
    userBenefitsService as any,
    { findOneBy: jest.fn() } as any,
    helpers as any,
  );
  return { service, lines, stray, nameSpy, userBenefitsService, planSubscriptionsRepository, planPriceService, helpers };
};

const newPlanPrice = { id: 4, price: 20, stripe_id: 'price_new' };
const freeSub = { id: 1, stripe_id: null, stripe_item_id: null, plan_price_id: 1, plan_price: { price: 0, plan: { is_free: true } } };
const paidSub = { id: 2, stripe_id: 'sub_1', stripe_item_id: 'si_1', plan_price_id: 2, plan_price: { price: 10, plan: { is_free: false } } };
const input = (current: unknown, extra: Record<string, unknown> = {}) =>
  ({ currentUserSubscription: current, newPlanPrice, successUrl: 'https://app.test/ok', cancelUrl: 'https://app.test/no', ...extra }) as any;

const line = (lines: any[], message: string) => lines.filter((l) => l.message === message);

describe('PlanSubscriptionsService logging', () => {
  beforeEach(() => {
    Object.values(mockStripe).forEach((group) =>
      Object.values(group).forEach((fn: any) => (typeof fn === 'function' ? fn.mockReset() : Object.values(fn).forEach((f: any) => f.mockReset()))),
    );
    mockStripe.paymentMethods.list.mockResolvedValue({ data: [] });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('AC-18: checkout passes trace metadata on the session and the subscription, client_reference_id, and logs a safe line', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_1', url: CHECKOUT_URL, object: 'checkout.session', customer_email: EMAIL });
    const { service, lines } = build();
    const result = await runWithTraceId('R', () =>
      service.handleStripeSubscription(input(freeSub, { benefit_id: 5 })),
    );
    expect(result.redirect_url).toBe(CHECKOUT_URL);
    const params = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(params.metadata).toMatchObject({ requestId: 'R', user_id: '9' });
    expect(params.metadata.requestAt).toMatch(/^\d+$/);
    expect(params.client_reference_id).toBe('9');
    expect(params.subscription_data.metadata).toMatchObject({ requestId: 'R', user_id: '9', benefit_id: '5' });
    expect(params.subscription_data.trial_period_days).toBe(7);

    const [created] = line(lines, 'Stripe checkout session created');
    expect(created.id).toBe('R');
    expect(created.extraInfo).toMatchObject({ user_id: 9, stripe_customer_id: 'cus_1', stripe_checkout_session_id: 'cs_1' });
    expect(created.extraInfo).toMatchObject({ plan_price_id: 4, stripe_price_id: 'price_new', trial_days: 7, benefit_id: 5 });
    const dumped = JSON.stringify(lines);
    expect(dumped).not.toContain('SECRETLINK');
    expect(dumped).not.toContain(CHECKOUT_URL);
    expect(dumped).not.toContain(EMAIL);
    expect(dumped).not.toContain('"object":"checkout.session"');
  });

  it('AC-18: without a benefit the subscription metadata has no benefit_id', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_2', url: CHECKOUT_URL });
    const { service } = build();
    await runWithTraceId('R', () => service.handleStripeSubscription(input(freeSub)));
    const params = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect('benefit_id' in params.subscription_data.metadata).toBe(false);
  });

  it('AC-19: a plan change passes trace metadata and logs the outcome with the subscription id', async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({ status: 'active' });
    mockStripe.subscriptions.update.mockResolvedValue({ status: 'active', object: 'subscription', items: { data: [] } });
    const { service, lines } = build();
    const result = await runWithTraceId('R', () => service.handleStripeSubscription(input(paidSub)));
    expect(result.ok).toBe(true);
    const [, params] = mockStripe.subscriptions.update.mock.calls[0];
    expect(params.metadata).toMatchObject({ requestId: 'R', user_id: '9' });
    expect(params.metadata.requestAt).toMatch(/^\d+$/);
    const [changed] = line(lines, 'Stripe subscription plan changed');
    expect(changed.extraInfo.stripe_subscription_id).toBe('sub_1');
    expect(changed.extraInfo).toMatchObject({ from_plan_price_id: 2, to_plan_price_id: 4, is_upgrade: true, stripe_status: 'active' });
    expect(JSON.stringify(lines)).not.toMatch(/"object":"subscription"|"items"/);
  });

  it('AC-19: a declined card (402) logs exactly one warn with the decline code and no critical', async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({ status: 'active' });
    mockStripe.subscriptions.update.mockRejectedValue(cardError(402));
    const { service, lines, stray } = build();
    const result = await runWithTraceId('R', () => service.handleStripeSubscription(input(paidSub)));
    expect(result.ok).toBe(false);
    const failures = line(lines, 'Stripe subscription change failed');
    expect(failures).toHaveLength(1);
    expect(failures[0].level).toBe('WARN');
    expect(failures[0].extraInfo.stripe_error).toMatchObject({ code: 'card_declined', decline_code: 'generic_decline', status_code: 402 });
    expect(failures[0].extraInfo).toMatchObject({ current_plan_subscription_id: 2, to_plan_price_id: 4 });
    expect(lines.filter((l) => l.level === 'CRITICAL')).toHaveLength(0);
    expect(JSON.stringify(lines)).not.toMatch(/SECRETKEY|authorization/);
    // The old code printed the raw error with console.log.
    expect(stray).toEqual([]);
  });

  it('AC-19: a Stripe 500 logs exactly one critical', async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({ status: 'active' });
    mockStripe.subscriptions.update.mockRejectedValue(cardError(500));
    const { service, lines } = build();
    await runWithTraceId('R', () => service.handleStripeSubscription(input(paidSub)));
    const criticals = lines.filter((l) => l.level === 'CRITICAL');
    expect(criticals).toHaveLength(1);
    expect(criticals[0].message).toBe('Stripe subscription change failed');
    expect(criticals[0].extraInfo.stripe_error.status_code).toBe(500);
  });

  it('AC-19: a non-Stripe error logs exactly one critical and nothing is printed raw', async () => {
    mockStripe.subscriptions.retrieve.mockResolvedValue({ status: 'active' });
    mockStripe.subscriptions.update.mockRejectedValue(new TypeError('boom'));
    const { service, lines, stray } = build();
    await runWithTraceId('R', () => service.handleStripeSubscription(input(paidSub)));
    expect(lines.filter((l) => l.level === 'CRITICAL')).toHaveLength(1);
    expect(stray).toEqual([]);
  });

  it('AC-19: the initiate success line has ok/payment_method only, never redirect_url', async () => {
    const { service, lines, planPriceService, planSubscriptionsRepository } = build();
    planPriceService.findOne.mockResolvedValue({ id: 4, price: 20, stripe_id: 'price_new', plan: { is_active: true, is_free: false } });
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue(freeSub);
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_3', url: CHECKOUT_URL });
    const result = await runWithTraceId('R', () =>
      service.initiate({ plan_price_id: 4, success_url: 'https://app.test/ok', cancel_url: 'https://app.test/no', payment_method: 'CARD' } as any),
    );
    expect(result.ok).toBe(true);
    const [done] = line(lines, 'Subscription process completed successfully');
    expect(done.extraInfo).toEqual({ ok: true, payment_method: 'CARD' });
    expect(JSON.stringify(lines)).not.toMatch(/redirect_url|SECRETLINK/);
  });

  it('AC-20: cancel() passes trace metadata and the line carries the subscription id', async () => {
    mockStripe.subscriptions.update.mockResolvedValue({ cancel_at: 1_800_000_000 });
    const { service, lines } = build();
    jest.spyOn(service, 'findActiveSubscription').mockResolvedValue({ id: 2, stripe_id: 'sub_1', plan_price: { plan: { is_free: false } } } as any);
    jest.spyOn(service, 'update').mockResolvedValue({} as any);
    await runWithTraceId('R', () => service.cancel(9));
    const [cancelled] = line(lines, 'Updated subscription status in database to cancel at period end');
    const [id, params] = mockStripe.subscriptions.update.mock.calls[0];
    expect(id).toBe('sub_1');
    expect(params).toMatchObject({ cancel_at_period_end: true });
    expect(params.metadata).toMatchObject({ requestId: 'R', user_id: '9' });
    expect(cancelled.extraInfo).toMatchObject({ userId: 9, stripe_subscription_id: 'sub_1' });
    expect(cancelled.id).toBe('R');
  });

  it('AC-20: the billing portal line has the portal session id and the URL appears in no line', async () => {
    mockStripe.billingPortal.sessions.create.mockResolvedValue({ id: 'bps_1', url: PORTAL_URL });
    const { service, lines } = build();
    const result = await runWithTraceId('R', () => service.getCustomerSubscriptionPortal({ return_url: 'https://app.test/account' } as any));
    expect(result.url).toBe(PORTAL_URL);
    const [created] = line(lines, 'Stripe billing portal session created');
    expect(created.extraInfo).toEqual({ stripe_customer_id: 'cus_1', portal_session_id: 'bps_1' });
    expect(created.extraInfo.stripe_customer_id).toBe('cus_1');
    expect(JSON.stringify(lines)).not.toMatch(/SECRETPORTAL|billing\.stripe\.com/);
  });

  it('AC-19: the service never renames the shared logger', async () => {
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_4', url: CHECKOUT_URL });
    const { service, nameSpy } = build();
    await runWithTraceId('R', () => service.handleStripeSubscription(input(freeSub)));
    expect(nameSpy).not.toHaveBeenCalled();
  });
});
