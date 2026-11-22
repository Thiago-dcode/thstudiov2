jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {}, stripeWebhookSecret: '' }));
jest.mock('@repo/backend-lib/services/payment-service/paypal', () => ({ paypal: {} }));
// The real helper dynamic-imports `uuid`, which Jest can't run without VM modules.
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({ generateUUID: jest.fn(async () => 'public-uuid') }));

import { HttpException } from '@nestjs/common';
import {
  ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
  CANCEL_ACCOUNT_PAYMENTS_EVENT,
} from '@repo/common-lib/constants/events';
import { UserService } from './users.service';

describe('UserService.deleteAccount', () => {
  const userRepository = {
    findById: jest.fn(),
    getDeletionState: jest.fn(),
    hardDeleteById: jest.fn(),
  };
  const eventEmitter = { emit: jest.fn(), emitAsync: jest.fn() };
  const logService = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const helpers = { deleteManyCached: jest.fn() };
  const tempUploads = { deleteUser: jest.fn() };
  const usernameHistoryRepository = { findReservedByUser: jest.fn() };
  const storageService = { deleteDirectory: jest.fn() };

  const user = {
    id: 7,
    public_id: '3a86d9e2-72cd-409c-8a1b-763622039afe',
    username: 'ana',
    stripe_customer_id: 'cus_1',
  };
  const state = (overrides = {}) => ({ flagged: true, warned: true, due: true, in_warning_window: false, ...overrides });

  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.getDeletionState.mockResolvedValue(state());
    userRepository.findById.mockResolvedValue(user);
    userRepository.hardDeleteById.mockResolvedValue(true);
    eventEmitter.emitAsync.mockResolvedValue([undefined]);
    storageService.deleteDirectory.mockResolvedValue(true);
    tempUploads.deleteUser.mockResolvedValue(true);
    usernameHistoryRepository.findReservedByUser.mockResolvedValue(['ana-old']);
    service = new UserService(
      userRepository as never,
      eventEmitter as never,
      {} as never, // mailService
      helpers as never,
      { log: () => logService } as never, // requestService
      {} as never, // notifyNewUserMail
      {} as never, // aiService
      {} as never, // profileStatusService
      {} as never, // userSessionsService
      tempUploads as never,
      usernameHistoryRepository as never,
      storageService as never,
    );
  });

  it('aborts when the account was reopened', async () => {
    userRepository.getDeletionState.mockResolvedValue(state({ flagged: false }));

    await expect(service.deleteAccount(7)).resolves.toEqual({ deleted: false, reason: 'reopened' });
    expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
    expect(userRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('aborts when the grace period has not passed', async () => {
    userRepository.getDeletionState.mockResolvedValue(state({ due: false }));

    await expect(service.deleteAccount(7)).resolves.toEqual({ deleted: false, reason: 'not-due' });
    expect(userRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('logs every early return with its reason', async () => {
    userRepository.getDeletionState.mockResolvedValue(null);

    await expect(service.deleteAccount(7)).resolves.toEqual({ deleted: false, reason: 'not-found' });
    expect(logService.info).toHaveBeenCalledWith(
      'Account deletion step skipped',
      { user_id: 7, step: 'hard-delete', reason: 'not-found', operation: 'hard-delete' },
    );
  });

  it('cancels billing via the event, wipes the storage folder, then deletes the rows', async () => {
    await expect(service.deleteAccount(7)).resolves.toEqual({ deleted: true });

    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      CANCEL_ACCOUNT_PAYMENTS_EVENT,
      expect.objectContaining({ userId: 7, stripeCustomerId: 'cus_1' }),
    );
    expect(eventEmitter.emitAsync.mock.invocationCallOrder[0]).toBeLessThan(
      storageService.deleteDirectory.mock.invocationCallOrder[0],
    );
    expect(storageService.deleteDirectory).toHaveBeenCalledWith(`users/${user.public_id}/`);
    expect(tempUploads.deleteUser).toHaveBeenCalledWith(user.public_id);
    expect(userRepository.hardDeleteById).toHaveBeenCalledWith(7, 15, { force: false });
    expect(helpers.deleteManyCached).toHaveBeenCalled();
  });

  it('keeps everything when cancelling payments fails (retried later)', async () => {
    eventEmitter.emitAsync.mockRejectedValue(new Error('stripe down'));

    await expect(service.deleteAccount(7)).rejects.toThrow('stripe down');
    expect(storageService.deleteDirectory).not.toHaveBeenCalled();
    expect(userRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('refuses to go on when no listener handled the payments event', async () => {
    eventEmitter.emitAsync.mockResolvedValue([]);

    await expect(service.deleteAccount(7)).rejects.toThrow('No listener cancelled the payments');
    expect(storageService.deleteDirectory).not.toHaveBeenCalled();
  });

  it('purges the cached pages of every name the account had, read before the rows are gone', async () => {
    await expect(service.deleteAccount(7)).resolves.toEqual({ deleted: true });

    expect(usernameHistoryRepository.findReservedByUser.mock.invocationCallOrder[0]).toBeLessThan(
      userRepository.hardDeleteById.mock.invocationCallOrder[0],
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      expect.objectContaining({ userId: 7, usernames: ['ana', 'ana-old'] }),
    );
  });

  it('still hard-deletes when the reserved names cannot be read, purging the current name only', async () => {
    usernameHistoryRepository.findReservedByUser.mockRejectedValue(new Error('pool exhausted'));

    await expect(service.deleteAccount(7)).resolves.toEqual({ deleted: true });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      expect.objectContaining({ userId: 7, usernames: ['ana'] }),
    );
  });

  it('sends no purge when the rows were not deleted', async () => {
    userRepository.hardDeleteById.mockResolvedValue(false);

    await expect(service.deleteAccount(7)).resolves.toEqual({ deleted: false, reason: 'changed-during-delete' });
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('still deletes the account when clearing pending uploads throws', async () => {
    tempUploads.deleteUser.mockRejectedValue(new Error('PRIVATE_BUCKET is not set'));

    await expect(service.deleteAccount(7)).resolves.toEqual({ deleted: true });
  });

  it('refuses a malformed public_id instead of widening the storage delete', async () => {
    userRepository.findById.mockResolvedValue({ ...user, public_id: '' });

    await expect(service.deleteAccount(7)).rejects.toThrow('unexpected public_id');
    expect(storageService.deleteDirectory).not.toHaveBeenCalled();
  });

  it('keeps the rows when the storage folder could not be deleted (retried later)', async () => {
    storageService.deleteDirectory.mockResolvedValue(false);

    await expect(service.deleteAccount(7)).rejects.toThrow();
    expect(userRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  describe('forceDelete', () => {
    it('deletes a non-flagged account without reading its deletion state, forcing the final delete too', async () => {
      userRepository.getDeletionState.mockResolvedValue(state({ flagged: false, due: false }));

      await expect(service.deleteAccount(7, true)).resolves.toEqual({ deleted: true });
      expect(userRepository.getDeletionState).not.toHaveBeenCalled();
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(CANCEL_ACCOUNT_PAYMENTS_EVENT, expect.anything());
      expect(userRepository.hardDeleteById).toHaveBeenCalledWith(7, 15, { force: true });
    });

    it('skips a missing user instead of throwing', async () => {
      userRepository.findById.mockRejectedValue(new HttpException('User not found with id 7', 404));

      await expect(service.deleteAccount(7, true)).resolves.toEqual({ deleted: false, reason: 'not-found' });
      expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
    });

    it('still refuses a malformed public_id', async () => {
      userRepository.findById.mockResolvedValue({ ...user, public_id: 'x' });

      await expect(service.deleteAccount(7, true)).rejects.toThrow('unexpected public_id');
    });
  });
});
