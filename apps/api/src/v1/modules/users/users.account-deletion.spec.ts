jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
  stripeWebhookSecret: '',
}));
// The real helper dynamic-imports `uuid`, which Jest can't run without VM modules.
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'public-uuid'),
}));

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CANCEL_SUBSCRIPTION_RENEWAL_EVENT } from '@repo/common-lib/constants/events';
import { hash } from '@repo/common-lib/utils/hash';
import { differenceInCalendarDays } from 'date-fns';
import { UserService } from './users.service';

describe('UserService — account deletion / deactivation', () => {
  const userRepository = {
    findOneByWithSecrets: jest.fn(),
    findById: jest.fn(),
    flagForDeletion: jest.fn(),
    unflagDeletion: jest.fn(),
    getDeletionState: jest.fn(),
    setActive: jest.fn(),
    isPublicAccount: jest.fn(),
  };
  const eventEmitter = { emitAsync: jest.fn() };
  const logger = { info: jest.fn() };
  const logService = { name: jest.fn(() => logger) };
  const requestService: { user: unknown } = { user: null };
  const helpers = { getAsset: jest.fn() };

  let service: UserService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hash('right-password');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    requestService.user = null;
    service = new UserService(
      userRepository as never,
      eventEmitter as never,
      logService as never,
      {} as never, // mailService
      helpers as never,
      requestService as never,
      {} as never, // notifyNewUserMail
      {} as never, // aiService
      {} as never, // profileStatusService
      {} as never, // plansService
    );
  });

  describe('requestDeletion', () => {
    // Lazy: `passwordHash` is only set once `beforeAll` has run.
    const flaggable = () => ({ id: 7, password: passwordHash, deletion_requested_at: null });

    it('flags the account and returns the scheduled deletion date', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(flaggable());
      const requestedAt = new Date('2026-10-14T10:00:00Z');
      userRepository.flagForDeletion.mockResolvedValue(requestedAt);

      const result = await service.requestDeletion(7, { password: 'right-password' });

      expect(userRepository.flagForDeletion).toHaveBeenCalledWith(7);
      expect(result.deletion_requested_at).toBe(requestedAt);
      // Calendar days, not 360h: the window may cross a DST change.
      expect(differenceInCalendarDays(result.deletion_scheduled_for, requestedAt)).toBe(15);
      expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
    });

    it('throws 409 when the account is already flagged', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue({ ...flaggable(), deletion_requested_at: new Date() });

      await expect(service.requestDeletion(7, { password: 'right-password' })).rejects.toBeInstanceOf(ConflictException);
      expect(userRepository.flagForDeletion).not.toHaveBeenCalled();
    });

    it('throws 409 when a concurrent request flagged it first', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(flaggable());
      userRepository.flagForDeletion.mockResolvedValue(null);

      await expect(service.requestDeletion(7, { password: 'right-password' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a wrong password without flagging', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(flaggable());

      await expect(service.requestDeletion(7, { password: 'nope' })).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.flagForDeletion).not.toHaveBeenCalled();
    });

    it('stops the subscription renewal before flagging when asked to', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(flaggable());
      userRepository.flagForDeletion.mockResolvedValue(new Date());

      await service.requestDeletion(7, { password: 'right-password', cancel_subscription: true });

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        CANCEL_SUBSCRIPTION_RENEWAL_EVENT,
        expect.objectContaining({ userId: 7 }),
      );
      expect(eventEmitter.emitAsync.mock.invocationCallOrder[0]).toBeLessThan(
        userRepository.flagForDeletion.mock.invocationCallOrder[0],
      );
    });

    it('does not flag when cancelling the subscription fails', async () => {
      userRepository.findOneByWithSecrets.mockResolvedValue(flaggable());
      eventEmitter.emitAsync.mockRejectedValue(new Error('stripe down'));

      await expect(
        service.requestDeletion(7, { password: 'right-password', cancel_subscription: true }),
      ).rejects.toThrow('stripe down');
      expect(userRepository.flagForDeletion).not.toHaveBeenCalled();
    });
  });

  describe('cancelDeletion', () => {
    it('unflags a flagged account inside the grace period', async () => {
      userRepository.unflagDeletion.mockResolvedValue(true);

      await expect(service.cancelDeletion(7)).resolves.toEqual({ deletion_requested_at: null });
      expect(userRepository.unflagDeletion).toHaveBeenCalledWith(7, 15);
    });

    it('throws 409 when the account is not flagged', async () => {
      userRepository.unflagDeletion.mockResolvedValue(false);
      userRepository.getDeletionState.mockResolvedValue({ flagged: false });

      await expect(service.cancelDeletion(7)).rejects.toThrow('Account deletion was not requested');
    });

    it('throws 409 once the deletion date has passed', async () => {
      userRepository.unflagDeletion.mockResolvedValue(false);
      userRepository.getDeletionState.mockResolvedValue({ flagged: true, due: true });

      await expect(service.cancelDeletion(7)).rejects.toThrow('can no longer be cancelled');
    });
  });

  describe('deactivate / reactivate', () => {
    it('deactivates an active account', async () => {
      userRepository.setActive.mockResolvedValue(true);
      await expect(service.deactivate(7)).resolves.toEqual({ is_active: false });
      expect(userRepository.setActive).toHaveBeenCalledWith(7, false);
    });

    it('throws 409 when the account is already deactivated', async () => {
      userRepository.setActive.mockResolvedValue(false);
      await expect(service.deactivate(7)).rejects.toBeInstanceOf(ConflictException);
    });

    it('reactivates an inactive account', async () => {
      userRepository.setActive.mockResolvedValue(true);
      await expect(service.reactivate(7)).resolves.toEqual({ is_active: true });
      expect(userRepository.setActive).toHaveBeenCalledWith(7, true);
    });

    it('throws 409 when the account is already active', async () => {
      userRepository.setActive.mockResolvedValue(false);
      await expect(service.reactivate(7)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne visibility', () => {
    it('hides a hidden account from other signed-in users', async () => {
      requestService.user = { id: 1, role: { name: 'ARTIST' } };
      userRepository.isPublicAccount.mockResolvedValue(false);

      await expect(service.findOne(7)).rejects.toBeInstanceOf(NotFoundException);
      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('still serves the owner their own hidden account', async () => {
      requestService.user = { id: 7, role: { name: 'ARTIST' } };
      userRepository.findById.mockResolvedValue({ id: 7 });

      await expect(service.findOne(7)).resolves.toEqual({ id: 7 });
      expect(userRepository.isPublicAccount).not.toHaveBeenCalled();
    });
  });
});
