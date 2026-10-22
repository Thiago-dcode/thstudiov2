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
import {
  JOB_DELETE_USER_ACCOUNT,
  JOB_SEND_ACCOUNT_DELETION_WARNING,
} from '@repo/common-lib/constants/queues';
import { AccountDeletionProcessor } from './account-deletion.processor';

describe('AccountDeletionProcessor', () => {
  const userRepository = {
    findById: jest.fn(),
    getDeletionState: jest.fn(),
    hardDeleteById: jest.fn(),
    markDeletionWarningSent: jest.fn(),
  };
  const planSubscriptionsRepository = { findActiveSubscription: jest.fn() };
  const storageService = { deleteDirectory: jest.fn() };
  const tempUploads = { deleteUser: jest.fn() };
  const helpers = { deleteManyCached: jest.fn() };
  const mailService = { sendAsync: jest.fn() };
  const warningMail = { setData: jest.fn((data) => ({ data })) };
  const logger = { info: jest.fn(), error: jest.fn(), name: jest.fn(), flushAsync: jest.fn() };

  const user = {
    id: 7,
    public_id: '3a86d9e2-72cd-409c-8a1b-763622039afe',
    email: 'ana@example.com',
    username: 'ana',
    language: 'ES',
    stripe_customer_id: 'cus_1',
    deletion_requested_at: new Date('2026-10-01T10:00:00Z'),
  };
  const state = (overrides = {}) => ({
    flagged: true,
    warned: false,
    due: false,
    in_warning_window: false,
    ...overrides,
  });

  let processor: AccountDeletionProcessor;
  const run = (name: string) => processor.process({ name, data: { user_id: 7 } } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    logger.name.mockReturnValue(logger);
    storageService.deleteDirectory.mockResolvedValue(true);
    tempUploads.deleteUser.mockResolvedValue(true);
    userRepository.hardDeleteById.mockResolvedValue(true);
    userRepository.findById.mockResolvedValue(user);
    planSubscriptionsRepository.findActiveSubscription.mockResolvedValue(null);
    processor = new AccountDeletionProcessor(
      userRepository as never,
      planSubscriptionsRepository as never,
      storageService as never,
      helpers as never,
      mailService as never,
      warningMail as never,
      logger as never,
      tempUploads as never,
    );
  });

  describe('hard delete', () => {
    it('aborts when the account was reopened', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ flagged: false }));

      await expect(run(JOB_DELETE_USER_ACCOUNT)).resolves.toEqual({ deleted: false, reason: 'reopened' });
      expect(storageService.deleteDirectory).not.toHaveBeenCalled();
      expect(userRepository.hardDeleteById).not.toHaveBeenCalled();
    });

    it('aborts when the grace period has not passed', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ warned: true }));

      await expect(run(JOB_DELETE_USER_ACCOUNT)).resolves.toEqual({ deleted: false, reason: 'not-due' });
      expect(userRepository.hardDeleteById).not.toHaveBeenCalled();
    });

    it('cancels billing, wipes the storage folder, then deletes the rows', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ warned: true, due: true }));
      planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({ stripe_id: 'sub_1', paypal_id: null });

      await expect(run(JOB_DELETE_USER_ACCOUNT)).resolves.toEqual({ deleted: true });

      expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_1');
      expect(stripe.customers.del).toHaveBeenCalledWith('cus_1');
      expect(storageService.deleteDirectory).toHaveBeenCalledWith(`users/${user.public_id}/`);
      expect(tempUploads.deleteUser).toHaveBeenCalledWith(user.public_id);
      expect(userRepository.hardDeleteById).toHaveBeenCalledWith(7, 15);
      expect(helpers.deleteManyCached).toHaveBeenCalled();
    });

    it('still deletes the account when clearing pending uploads throws', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ warned: true, due: true }));
      planSubscriptionsRepository.findActiveSubscription.mockResolvedValue(null);
      tempUploads.deleteUser.mockRejectedValue(new Error('PRIVATE_BUCKET is not set'));

      await expect(run(JOB_DELETE_USER_ACCOUNT)).resolves.toEqual({ deleted: true });
      expect(userRepository.hardDeleteById).toHaveBeenCalledWith(7, 15);
    });

    it('treats an already-cancelled Stripe subscription as done', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ warned: true, due: true }));
      planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({ stripe_id: 'sub_1', paypal_id: null });
      (stripe.subscriptions.cancel as jest.Mock).mockRejectedValueOnce({ code: 'resource_missing' });

      await expect(run(JOB_DELETE_USER_ACCOUNT)).resolves.toEqual({ deleted: true });
    });

    it('still deletes, and alerts, when PayPal refuses the cancellation', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ warned: true, due: true }));
      planSubscriptionsRepository.findActiveSubscription.mockResolvedValue({ stripe_id: null, paypal_id: 'I-123' });
      paypalCancel.mockResolvedValue(null);

      await expect(run(JOB_DELETE_USER_ACCOUNT)).resolves.toEqual({ deleted: true });
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('I-123'));
    });

    it('refuses a malformed public_id instead of widening the storage delete', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ warned: true, due: true }));
      userRepository.findById.mockResolvedValue({ ...user, public_id: '' });

      await expect(run(JOB_DELETE_USER_ACCOUNT)).rejects.toThrow('unexpected public_id');
      expect(storageService.deleteDirectory).not.toHaveBeenCalled();
      expect(userRepository.hardDeleteById).not.toHaveBeenCalled();
    });

    it('keeps the rows when the storage folder could not be deleted (retried later)', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ warned: true, due: true }));
      storageService.deleteDirectory.mockResolvedValue(false);

      await expect(run(JOB_DELETE_USER_ACCOUNT)).rejects.toThrow();
      expect(userRepository.hardDeleteById).not.toHaveBeenCalled();
    });
  });

  describe('warning email', () => {
    it('sends once inside the window and stamps it', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ in_warning_window: true }));

      await expect(run(JOB_SEND_ACCOUNT_DELETION_WARNING)).resolves.toEqual({ sent: true });

      expect(mailService.sendAsync).toHaveBeenCalledTimes(1);
      const [data, lang] = warningMail.setData.mock.calls[0];
      expect(lang).toBe('ES');
      expect(data.reactivateUrl).toContain('/es/auth/login');
      expect(userRepository.markDeletionWarningSent).toHaveBeenCalledWith(7);
    });

    it('skips an already warned account', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ warned: true, in_warning_window: true }));

      await expect(run(JOB_SEND_ACCOUNT_DELETION_WARNING)).resolves.toEqual({ sent: false, reason: 'already-sent' });
      expect(mailService.sendAsync).not.toHaveBeenCalled();
    });

    it('skips a reopened account', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ flagged: false }));

      await expect(run(JOB_SEND_ACCOUNT_DELETION_WARNING)).resolves.toEqual({ sent: false, reason: 'not-flagged' });
      expect(mailService.sendAsync).not.toHaveBeenCalled();
    });

    it('does not send before the warning window', async () => {
      userRepository.getDeletionState.mockResolvedValue(state());

      await expect(run(JOB_SEND_ACCOUNT_DELETION_WARNING)).resolves.toEqual({ sent: false, reason: 'not-due' });
      expect(mailService.sendAsync).not.toHaveBeenCalled();
    });
  });
});
