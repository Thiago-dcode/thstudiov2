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

import { runWithTraceId } from 'src/common/services/request-storage';
import { consoleLogger } from 'src/common/testing/console-logger';
import { PlanSubscriptionsService } from './plan-subscriptions.service';

const EMAIL = 'victim@example.com';
const user = { id: 9, email: EMAIL, name: 'Ana', stripe_customer_id: 'cus_1' };

const build = () => {
  const lines: any[] = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
    });
  }
  const logger = consoleLogger({ defaultOptions: { channel: 'plan-subscriptions' } });
  const requestService = { user, log: () => logger, traceCarrier: () => ({ service: 'api' }) };
  const planSubscriptionsRepository = {
    findActiveSubscription: jest.fn(),
    findLatestSubscription: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(undefined),
    create: jest.fn(async (data: any) => ({ id: 77, ...data })),
  };
  const planPriceService = { findOne: jest.fn() };
  const planService = { findFreePlan: jest.fn() };
  const helpers = {
    deleteManyCached: jest.fn().mockResolvedValue(undefined),
    cacheRemember: jest.fn(),
    getNextBillingDate: jest.fn(() => new Date('2099-01-01')),
  };
  const service = new PlanSubscriptionsService(
    planSubscriptionsRepository as any,
    planPriceService as any,
    requestService as any,
    planService as any,
    { getOne: jest.fn().mockResolvedValue({ enabled: true }) } as any,
    { redeemed: jest.fn().mockResolvedValue(false), getByIdAndUser: jest.fn() } as any,
    { findOneBy: jest.fn() } as any,
    helpers as any,
  );
  return { service, lines, planPriceService, planSubscriptionsRepository, planService };
};

const initiate = (service: PlanSubscriptionsService, plan_price_id: number) =>
  runWithTraceId('R', () =>
    service.initiate({
      plan_price_id,
      success_url: 'https://app.test/ok',
      cancel_url: 'https://app.test/no',
      payment_method: 'CARD',
    } as any),
  );

const priceRow = (over: Record<string, unknown>) => ({
  id: 22,
  price: 20,
  stripe_id: 'price_plus_q20',
  billing_type: 'QUARTERLY',
  is_active: true,
  plan: { is_active: true, is_free: false },
  ...over,
});

const warnings = (lines: any[]) => lines.filter((l) => l.message === 'Attempted to subscribe to a non-purchasable price');

describe('PlanSubscriptionsService.initiate: only active MONTHLY/YEARLY prices can be bought', () => {
  beforeEach(() => {
    mockStripe.checkout.sessions.create.mockReset();
    mockStripe.paymentMethods.list.mockResolvedValue({ data: [] });
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-12: an inactive (retired QUARTERLY) price returns the existing failure, with one warn reason inactive-price', async () => {
    const { service, lines, planPriceService, planSubscriptionsRepository } = build();
    planPriceService.findOne.mockResolvedValue(priceRow({ is_active: false }));
    const result = await initiate(service, 22);
    expect(result).toMatchObject({ ok: false, message: 'Plan price does not exist', retryable: true, redirect_url: null });
    const warns = warnings(lines);
    expect(warns).toHaveLength(1);
    expect(warns[0].level).toBe('WARN');
    expect(warns[0].channel).toBe('plan-subscriptions');
    expect(warns[0].extraInfo).toEqual({ plan_price_id: 22, reason: 'inactive-price' });
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
    expect(planSubscriptionsRepository.findActiveSubscription).not.toHaveBeenCalled();
    expect(JSON.stringify(lines)).not.toContain(EMAIL);
  });

  it('AC-12: an inactive MONTHLY (old amount) price is also rejected as inactive-price', async () => {
    const { service, lines, planPriceService } = build();
    planPriceService.findOne.mockResolvedValue(priceRow({ id: 31, billing_type: 'MONTHLY', price: 14, is_active: false }));
    const result = await initiate(service, 31);
    expect(result).toMatchObject({ ok: false, message: 'Plan price does not exist', retryable: true });
    expect(warnings(lines).map((l) => l.extraInfo)).toEqual([{ plan_price_id: 31, reason: 'inactive-price' }]);
  });

  it('AC-12: an active QUARTERLY price is rejected with reason billing-type-not-purchasable', async () => {
    const { service, lines, planPriceService } = build();
    planPriceService.findOne.mockResolvedValue(priceRow({ is_active: true, billing_type: 'QUARTERLY' }));
    const result = await initiate(service, 22);
    expect(result).toMatchObject({ ok: false, message: 'Plan price does not exist', retryable: true });
    const warns = warnings(lines);
    expect(warns).toHaveLength(1);
    expect(warns[0].level).toBe('WARN');
    expect(warns[0].extraInfo).toEqual({ plan_price_id: 22, reason: 'billing-type-not-purchasable' });
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('AC-12: an active paid LIFETIME price is rejected with reason billing-type-not-purchasable', async () => {
    const { service, lines, planPriceService } = build();
    planPriceService.findOne.mockResolvedValue(priceRow({ id: 24, billing_type: 'LIFETIME', price: 300, is_active: true }));
    const result = await initiate(service, 24);
    expect(result).toMatchObject({ ok: false, message: 'Plan price does not exist' });
    expect(warnings(lines).map((l) => l.extraInfo.reason)).toEqual(['billing-type-not-purchasable']);
  });

  it.each(['MONTHLY', 'YEARLY'])('AC-12: an active %s price passes the guard and reaches checkout', async (billing_type) => {
    const { service, lines, planPriceService, planSubscriptionsRepository } = build();
    planPriceService.findOne.mockResolvedValue(priceRow({ id: 25, billing_type, price: 6, stripe_id: 'price_new', is_active: true }));
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({
      id: 1, stripe_id: null, stripe_item_id: null, plan_price_id: 14, plan_price: { price: 0, plan: { is_free: true } },
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_X' });
    const result = await initiate(service, 25);
    expect(result.ok).toBe(true);
    expect(warnings(lines)).toHaveLength(0);
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });
});

describe('PlanSubscriptionsService.setFreeSubscription', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-13: still creates a free LIFETIME subscription on the free plan\'s LIFETIME price', async () => {
    const { service, planService, planSubscriptionsRepository } = build();
    planService.findFreePlan.mockResolvedValue({
      id: 1,
      unique_identifier: 'free',
      is_free: true,
      prices: [{ id: 14, plan_id: 1, billing_type: 'LIFETIME', price: 0, is_active: true, stripe_id: null, paypal_id: null }],
    });
    const { subscription, plan } = await runWithTraceId('R', () => service.setFreeSubscription(9));
    expect(plan.id).toBe(1);
    expect(planSubscriptionsRepository.create).toHaveBeenCalledTimes(1);
    expect(planSubscriptionsRepository.create.mock.calls[0][0]).toMatchObject({
      user_id: 9,
      plan_price_id: 14,
      amount: 0,
      is_active: true,
      stripe_id: null,
    });
    expect(subscription).toMatchObject({ id: 77, plan_price_id: 14 });
  });
});

describe('PlanSubscriptionsService checkout: VAT ID collection (Addendum A)', () => {
  beforeEach(() => {
    mockStripe.checkout.sessions.create.mockReset();
    mockStripe.paymentMethods.list.mockResolvedValue({ data: [] });
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-24: the subscription checkout session collects tax IDs and lets Stripe update the customer address and name', async () => {
    const { service, planPriceService, planSubscriptionsRepository } = build();
    planPriceService.findOne.mockResolvedValue(priceRow({ id: 26, billing_type: 'YEARLY', price: 57.6, stripe_id: 'price_y', is_active: true }));
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({
      id: 1, stripe_id: null, stripe_item_id: null, plan_price_id: 14, plan_price: { price: 0, plan: { is_free: true } },
    });
    mockStripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_X' });
    const result = await initiate(service, 26);
    expect(result.ok).toBe(true);
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
    const params = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(params.mode).toBe('subscription');
    expect(params.customer).toBe('cus_1');
    expect(params.tax_id_collection).toEqual({ enabled: true });
    expect(params.customer_update).toEqual({ address: 'auto', name: 'auto' });
  });

  it('AC-24: the repo has exactly one checkout session creation site, and it carries the tax params', () => {
    const fs = jest.requireActual<typeof import('node:fs')>('node:fs');
    const path = jest.requireActual<typeof import('node:path')>('node:path');
    const source = fs.readFileSync(path.join(__dirname, 'plan-subscriptions.service.ts'), 'utf8');
    const sites = source.split('checkout.sessions.create(').length - 1;
    expect(sites).toBe(1);
    const call = source.slice(source.indexOf('checkout.sessions.create('));
    const body = call.slice(0, call.indexOf('});'));
    expect(body).toMatch(/tax_id_collection:\s*{\s*enabled:\s*true/);
    expect(body).toMatch(/name:\s*'auto'/);
  });
});
