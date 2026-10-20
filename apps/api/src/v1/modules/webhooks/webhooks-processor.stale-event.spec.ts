const retrieve = jest.fn();
const list = jest.fn().mockResolvedValue({ data: [] });
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { subscriptions: { retrieve, list, cancel: jest.fn() } },
}));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));

import type { Queue } from 'bullmq';
import type { LogService } from '@repo/backend-lib/services/log-service';
import { WebhookProcessor } from './webhooks-processor.service';
import type { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';
import type { PlanPricesService } from '../plan-prices/plan-prices.service';
import type { UserService } from '../users/users.service';
import type { UserBenefitService } from '../user-benefit/user-benefit.service';
import type { Helpers } from 'src/common/services/helpers.service';

const stripeSubscription = (status: string) => ({
  id: 'sub_1',
  status,
  customer: 'cus_1',
  cancel_at: null,
  cancel_at_period_end: false,
  default_payment_method: 'pm_1',
  metadata: {},
  items: { data: [{ id: 'si_1', price: { id: 'price_1' }, current_period_start: 1, current_period_end: 2 }] },
});

const build = () => {
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn(), channel: () => logger };
  const planSubscriptionService = {
    findActiveSubscription: jest.fn().mockResolvedValue(null),
    findLatestSubscription: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 9, stripe_id: 'sub_1' }),
    update: jest.fn(),
  };
  const processor = new WebhookProcessor(
    planSubscriptionService as unknown as PlanSubscriptionsService,
    { findOneByStripeId: jest.fn().mockResolvedValue({ id: 3, price: 10 }) } as unknown as PlanPricesService,
    { findOneByStripeId: jest.fn().mockResolvedValue({ id: 7, stripe_customer_id: 'cus_1' }) } as unknown as UserService,
    {} as UserBenefitService,
    { deleteCached: jest.fn(), deleteManyCached: jest.fn() } as unknown as Helpers,
    logger as unknown as LogService,
    { add: jest.fn() } as unknown as Queue,
  );
  const handle = (sub: unknown) =>
    (processor as unknown as { handleSubscriptionUpdate(s: unknown): Promise<void> }).handleSubscriptionUpdate(sub);
  return { handle, planSubscriptionService };
};

describe('WebhookProcessor subscription updates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ignores a late "active" snapshot of a subscription Stripe has since cancelled', async () => {
    retrieve.mockResolvedValue(stripeSubscription('canceled'));
    const { handle, planSubscriptionService } = build();
    await handle(stripeSubscription('active'));
    expect(retrieve).toHaveBeenCalledWith('sub_1');
    expect(planSubscriptionService.create).not.toHaveBeenCalled();
  });

  it('still starts a subscription Stripe reports as active', async () => {
    retrieve.mockResolvedValue(stripeSubscription('active'));
    const { handle, planSubscriptionService } = build();
    await handle(stripeSubscription('active')).catch(() => undefined);
    expect(planSubscriptionService.create).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_id: 'sub_1', is_active: true, user_id: 7 }),
    );
  });
});
