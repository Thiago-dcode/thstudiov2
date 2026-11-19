// The processor imports UserService, which loads the payment clients.
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {}, stripeWebhookSecret: '' }));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));

import {
  JOB_DELETE_USER_ACCOUNT,
  JOB_SEND_ACCOUNT_DELETION_WARNING,
} from '@repo/common-lib/constants/queues';
import { AccountDeletionProcessor } from './account-deletion.processor';

describe('AccountDeletionProcessor', () => {
  const userRepository = {
    findById: jest.fn(),
    getDeletionState: jest.fn(),
    markDeletionWarningSent: jest.fn(),
  };
  const userService = { deleteAccount: jest.fn() };
  const mailService = { sendAsync: jest.fn() };
  const warningMail = { setData: jest.fn((data) => ({ data })) };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn() };

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
    userRepository.findById.mockResolvedValue(user);
    processor = new AccountDeletionProcessor(
      userRepository as never,
      userService as never,
      mailService as never,
      warningMail as never,
      logger as never,
    );
  });

  describe('hard delete', () => {
    it('delegates to UserService.deleteAccount without forcing and returns its result', async () => {
      userService.deleteAccount.mockResolvedValue({ deleted: true });

      await expect(run(JOB_DELETE_USER_ACCOUNT)).resolves.toEqual({ deleted: true });
      expect(userService.deleteAccount).toHaveBeenCalledWith(7);
    });

    it('rethrows a failed delete so the job retries', async () => {
      userService.deleteAccount.mockRejectedValue(new Error('stripe down'));

      // Retry/critical logging per attempt is covered in account-deletion.processor.attempts.spec.ts.
      await expect(run(JOB_DELETE_USER_ACCOUNT)).rejects.toThrow('stripe down');
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
