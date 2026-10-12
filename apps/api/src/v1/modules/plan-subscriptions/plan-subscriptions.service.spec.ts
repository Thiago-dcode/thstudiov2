jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));

import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { Helpers } from 'src/common/services/helpers.service';
import { PlanSubscriptionsService } from './plan-subscriptions.service';
import { PlanSubscriptionsRepository } from './plan-subscriptions.repository';
import { PlanPricesService } from '../plan-prices/plan-prices.service';
import { PlansService } from '../plans/plans.service';
import { PaymentMethodsService } from '../utils/payment-methods.service';
import { UserBenefitService } from '../user-benefit/user-benefit.service';
import { UserRepository } from '../users/users.repository';

describe('PlanSubscriptionsService', () => {
  let service: PlanSubscriptionsService;
  const requestService: { user: Record<string, unknown> | null } = { user: null };
  const userRepository = { findOneBy: jest.fn() };
  const resolve = () =>
    (service as unknown as { resolveStripeCustomerId: () => Promise<string | null> }).resolveStripeCustomerId();

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanSubscriptionsService,
        { provide: LogService, useValue: { info: jest.fn(), error: jest.fn() } },
        { provide: PlanSubscriptionsRepository, useValue: {} },
        { provide: PlanPricesService, useValue: {} },
        { provide: RequestService, useValue: requestService },
        { provide: PlansService, useValue: {} },
        { provide: PaymentMethodsService, useValue: {} },
        { provide: UserBenefitService, useValue: {} },
        { provide: UserRepository, useValue: userRepository },
        { provide: Helpers, useValue: {} },
      ],
    }).compile();
    service = module.get(PlanSubscriptionsService);
  });

  describe('resolveStripeCustomerId', () => {
    it('uses the id carried by the session token', async () => {
      requestService.user = { id: 6, stripe_customer_id: 'cus_token' };
      await expect(resolve()).resolves.toBe('cus_token');
      expect(userRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('reads the database when the token was signed before the customer existed', async () => {
      requestService.user = { id: 6, stripe_customer_id: null };
      userRepository.findOneBy.mockResolvedValue({ id: 6, stripe_customer_id: 'cus_db' });
      await expect(resolve()).resolves.toBe('cus_db');
      expect(userRepository.findOneBy).toHaveBeenCalledWith('id', 6);
    });

    it('returns null while the customer is genuinely not created yet', async () => {
      requestService.user = { id: 6, stripe_customer_id: null };
      userRepository.findOneBy.mockResolvedValue({ id: 6, stripe_customer_id: null });
      await expect(resolve()).resolves.toBeNull();
    });
  });
});
