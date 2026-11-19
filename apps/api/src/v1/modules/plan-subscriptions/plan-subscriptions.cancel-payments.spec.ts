const paypalCancel = jest.fn();
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {
    subscriptions: { cancel: jest.fn() },
    customers: { del: jest.fn() },
  },
  stripeWebhookSecret: '',
}));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({
  paypal: Promise.resolve({ subscription: { cancel: (...args: unknown[]) => paypalCancel(...args) } }),
}));

import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { PlanSubscriptionsService } from './plan-subscriptions.service';

describe('PlanSubscriptionsService.cancelPayments', () => {
  const planSubscriptionsRepository = { findActiveSubscription: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
  let service: PlanSubscriptionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue(null);
    service = new PlanSubscriptionsService(
      logger as never,
      planSubscriptionsRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('cancels the Stripe subscription and deletes the customer', async () => {
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({ stripe_id: 'sub_1', paypal_id: null });

    await service.cancelPayments(7, 'cus_1');

    expect(planSubscriptionsRepository.findActiveSubscription).toHaveBeenCalledWith(7);
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_1');
    expect(stripe.customers.del).toHaveBeenCalledWith('cus_1');
  });

  it('AC-28: logs one "Account payments cancelled" with the ids and outcome flags and no emails', async () => {
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({ stripe_id: 'sub_1', paypal_id: null });

    await service.cancelPayments(7, 'cus_1');

    const calls = logger.info.mock.calls.filter((c) => c[0] === 'Account payments cancelled');
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toEqual({
      user_id: 7,
      stripe_subscription_id: 'sub_1',
      stripe_customer_id: 'cus_1',
      stripe_subscription_cancelled: true,
      stripe_customer_deleted: true,
      paypal_cancelled: false,
    });
    expect(calls[0][2]).toEqual({ operation: 'hard-delete' });
    expect(JSON.stringify(calls)).not.toMatch(/@/);
  });

  it('AC-28: treats an already-cancelled Stripe subscription as done, reported as not cancelled', async () => {
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({ stripe_id: 'sub_1', paypal_id: null });
    (stripe.subscriptions.cancel as jest.Mock).mockRejectedValueOnce({ code: 'resource_missing' });

    await expect(service.cancelPayments(7, 'cus_1')).resolves.toBeUndefined();

    const call = logger.info.mock.calls.find((c) => c[0] === 'Account payments cancelled')!;
    expect(call[1]).toMatchObject({ stripe_subscription_cancelled: false, stripe_customer_deleted: true });
  });

  it('treats an already-deleted Stripe customer as done', async () => {
    (stripe.customers.del as jest.Mock).mockRejectedValueOnce({ statusCode: 404 });

    await expect(service.cancelPayments(7, 'cus_1')).resolves.toBeUndefined();
  });

  it('rethrows any other Stripe failure so the job retries', async () => {
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({ stripe_id: 'sub_1', paypal_id: null });
    (stripe.subscriptions.cancel as jest.Mock).mockRejectedValueOnce(Object.assign(new Error('down'), { statusCode: 500 }));

    await expect(service.cancelPayments(7, 'cus_1')).rejects.toThrow('down');
    expect(stripe.customers.del).not.toHaveBeenCalled();
  });

  it('does not throw, and alerts, when PayPal refuses the cancellation', async () => {
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({ stripe_id: null, paypal_id: 'I-123' });
    paypalCancel.mockResolvedValue(null);

    await expect(service.cancelPayments(7, null)).resolves.toBeUndefined();
    expect(paypalCancel).toHaveBeenCalledWith('I-123', 'Account deleted');
    expect(logger.critical).toHaveBeenCalledWith(
      'PayPal subscription of deleted user could not be cancelled; check it manually',
      expect.objectContaining({ paypal_subscription_id: 'I-123' }),
      expect.objectContaining({ operation: 'hard-delete' }),
    );
  });
});

describe('PlanSubscriptionsService CANCEL_ACCOUNT_PAYMENTS_EVENT listener', () => {
  it('forwards the event to cancelPayments and lets its errors through (no suppressErrors)', async () => {
    const { CANCEL_ACCOUNT_PAYMENTS_EVENT } = await import('@repo/common-lib/constants/events');
    // `@OnEvent` stores `[{ event, options }]` under a key the package does not export.
    const handler = PlanSubscriptionsService.prototype.handleCancelAccountPayments;
    const meta = Reflect.getMetadataKeys(handler)
      .map((key) => Reflect.getMetadata(key, handler))
      .find((value) => Array.isArray(value) && value[0]?.event !== undefined);
    expect(meta).toEqual([expect.objectContaining({ event: CANCEL_ACCOUNT_PAYMENTS_EVENT, options: expect.objectContaining({ suppressErrors: false }) })]);

    const service = Object.create(PlanSubscriptionsService.prototype) as PlanSubscriptionsService;
    const cancelPayments = jest.spyOn(service, 'cancelPayments').mockRejectedValue(new Error('stripe down'));
    await expect(service.handleCancelAccountPayments({ userId: 7, stripeCustomerId: 'cus_1' })).rejects.toThrow('stripe down');
    expect(cancelPayments).toHaveBeenCalledWith(7, 'cus_1');
  });
});
