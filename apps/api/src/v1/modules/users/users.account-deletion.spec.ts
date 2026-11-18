jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: { customers: { create: jest.fn() } },
  stripeWebhookSecret: '',
}));
// The real helper dynamic-imports `uuid`, which Jest can't run without VM modules.
jest.mock('@repo/common-lib/utils/generate-uuid', () => ({
  generateUUID: jest.fn(async () => 'public-uuid'),
}));

// A real per-key mutex, like the Redis lock: concurrency specs must see calls serialized.
jest.mock('src/common/utils/user-lock', () => {
  const chains = new Map<string, Promise<unknown>>();
  return {
    withUserLock: jest.fn((key: string, _ttl: number, fn: () => Promise<unknown>) => {
      const run = (chains.get(key) ?? Promise.resolve()).then(fn, fn);
      chains.set(key, run.catch(() => undefined));
      return run;
    }),
  };
});

import { BadRequestException, ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import {
  ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
  CANCEL_SUBSCRIPTION_RENEWAL_EVENT,
} from '@repo/common-lib/constants/events';
import {
  CACHE_KEY_ACCOUNT_DELETION_CODE,
  CACHE_KEY_ACCOUNT_DELETION_CODE_COOLDOWN,
} from '@repo/common-lib/constants/cache';
import { differenceInCalendarDays } from 'date-fns';
import { UserService } from './users.service';

describe('UserService — account deletion / deactivation', () => {
  const userRepository = {
    findOneBy: jest.fn(),
    findById: jest.fn(),
    flagForDeletion: jest.fn(),
    unflagDeletion: jest.fn(),
    getDeletionState: jest.fn(),
    setActive: jest.fn(),
    isPublicAccount: jest.fn(),
    hasPassword: jest.fn(),
  };
  const eventEmitter = { emitAsync: jest.fn(), emit: jest.fn() };
  /** The edge purge of the artist's cached pages (see `EdgeCacheService`). */
  const purgeEmitted = (userId: number) =>
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      expect.objectContaining({ userId }),
    );
  const logger = { info: jest.fn() };
  const logService = { name: jest.fn(() => logger), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const requestService: { user: unknown } = { user: null };
  // Redis stand-in: the deletion code lives in the cache.
  const cache = new Map<string, unknown>();
  const helpers = {
    getAsset: jest.fn(),
    getCached: jest.fn(async (key: string) => cache.get(key)),
    setCached: jest.fn(async (key: string, value: unknown) => {
      cache.set(key, JSON.parse(JSON.stringify(value)));
    }),
    deleteCached: jest.fn(async (key: string) => {
      cache.delete(key);
    }),
    deleteManyCached: jest.fn(async (keys: string[]) => {
      keys.forEach((key) => cache.delete(key));
    }),
  };
  const mailService = { send: jest.fn() };
  /** Captures the plain code handed to the mail, as the user would read it in the inbox. */
  const accountDeletionCodeMail = { setData: jest.fn((data: { code: string }) => data) };
  const sentCode = () => accountDeletionCodeMail.setData.mock.calls.at(-1)![0].code as string;
  const KEY = CACHE_KEY_ACCOUNT_DELETION_CODE(7);

  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
    requestService.user = null;
    mailService.send.mockResolvedValue(undefined);
    service = new UserService(
      userRepository as never,
      eventEmitter as never,
      logService as never,
      mailService as never,
      helpers as never,
      requestService as never,
      {} as never, // notifyNewUserMail
      {} as never, // aiService
      {} as never, // profileStatusService
      {} as never, // userSessionsService
      {} as never, // tempUploads
      {} as never, // usernameHistoryRepository
      {} as never, // storageService
      accountDeletionCodeMail as never,
    );
  });

  const flaggable = () => ({ id: 7, email: 'ana@example.com', name: 'Ana', language: 'en', deletion_requested_at: null });

  describe('sendDeletionCode', () => {
    it('emails a 6-digit code and stores only its hash, for 10 minutes', async () => {
      userRepository.findById.mockResolvedValue(flaggable());

      const result = await service.sendDeletionCode(7);

      const code = sentCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(mailService.send).toHaveBeenCalledTimes(1);
      const stored = cache.get(KEY) as { hash: string; attempts: number };
      expect(stored.attempts).toBe(0);
      expect(JSON.stringify(stored)).not.toContain(code);
      expect(helpers.setCached).toHaveBeenCalledWith(KEY, expect.anything(), 10 * 60_000);
      expect(result.resend_available_at.getTime()).toBeLessThan(result.expires_at.getTime());
    });

    it('answers 429 when asked again inside the cooldown, without sending', async () => {
      userRepository.findById.mockResolvedValue(flaggable());
      await service.sendDeletionCode(7);

      await expect(service.sendDeletionCode(7)).rejects.toMatchObject({ status: 429 });
      expect(mailService.send).toHaveBeenCalledTimes(1);
    });

    it('keeps the cooldown after the code is burned, so codes cannot be cycled', async () => {
      userRepository.findById.mockResolvedValue(flaggable());
      userRepository.findOneBy.mockResolvedValue(flaggable());
      await service.sendDeletionCode(7);
      const code = sentCode();
      for (let i = 0; i < 5; i++) {
        await service.requestDeletion(7, { code: code === '000000' ? '111111' : '000000' }).catch(() => undefined);
      }
      expect(cache.has(KEY)).toBe(false);

      await expect(service.sendDeletionCode(7)).rejects.toMatchObject({ status: 429 });
      expect(mailService.send).toHaveBeenCalledTimes(1);
    });

    it('stops after 5 codes a day, even once each cooldown is over', async () => {
      userRepository.findById.mockResolvedValue(flaggable());
      const cooldownKey = CACHE_KEY_ACCOUNT_DELETION_CODE_COOLDOWN(7);
      for (let i = 0; i < 5; i++) {
        await service.sendDeletionCode(7);
        cache.delete(cooldownKey); // as if 60s passed
      }

      await expect(service.sendDeletionCode(7)).rejects.toMatchObject({ status: 429 });
      expect(mailService.send).toHaveBeenCalledTimes(5);
    });

    it('answers 409 when the account is already flagged', async () => {
      userRepository.findById.mockResolvedValue({ ...flaggable(), deletion_requested_at: new Date() });

      await expect(service.sendDeletionCode(7)).rejects.toBeInstanceOf(ConflictException);
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('drops the code and answers 503 when the mail fails', async () => {
      userRepository.findById.mockResolvedValue(flaggable());
      mailService.send.mockRejectedValue(new Error('550 <ana@example.com> rejected'));

      await expect(service.sendDeletionCode(7)).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(cache.has(KEY)).toBe(false);
      // Nothing reached the inbox: an immediate retry is allowed.
      expect(cache.has(CACHE_KEY_ACCOUNT_DELETION_CODE_COOLDOWN(7))).toBe(false);
      expect(logService.error).toHaveBeenCalledWith(
        'Failed to send account deletion code',
        expect.not.objectContaining({ error_message: expect.stringContaining('ana@example.com') }),
        expect.objectContaining({ operation: 'account-deletion' }),
      );
    });
  });

  describe('requestDeletion', () => {
    /** Sends a code and returns it, as read from the email. */
    const codeFromEmail = async () => {
      userRepository.findById.mockResolvedValue(flaggable());
      await service.sendDeletionCode(7);
      return sentCode();
    };
    const wrongCode = (code: string) => (code === '000000' ? '111111' : '000000');

    beforeEach(() => {
      userRepository.findOneBy.mockResolvedValue(flaggable());
    });

    it('flags the account with the emailed code and returns the scheduled deletion date', async () => {
      const code = await codeFromEmail();
      const requestedAt = new Date('2026-10-14T10:00:00Z');
      userRepository.flagForDeletion.mockResolvedValue(requestedAt);

      const result = await service.requestDeletion(7, { code });

      expect(userRepository.flagForDeletion).toHaveBeenCalledWith(7);
      expect(result.deletion_requested_at).toBe(requestedAt);
      // Calendar days, not 360h: the window may cross a DST change.
      expect(differenceInCalendarDays(result.deletion_scheduled_for, requestedAt)).toBe(15);
      expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
      purgeEmitted(7);
      expect(eventEmitter.emit.mock.invocationCallOrder[0]).toBeGreaterThan(
        userRepository.flagForDeletion.mock.invocationCallOrder[0],
      );
    });

    it('works for an account without a password (OAuth)', async () => {
      // Nothing about the password is read: the code is the only proof.
      userRepository.findOneBy.mockResolvedValue({ ...flaggable(), password: null });
      const code = await codeFromEmail();
      userRepository.flagForDeletion.mockResolvedValue(new Date());

      await expect(service.requestDeletion(7, { code })).resolves.toBeDefined();
    });

    it('burns the code after use', async () => {
      const code = await codeFromEmail();
      userRepository.flagForDeletion.mockResolvedValue(new Date());
      await service.requestDeletion(7, { code });

      expect(cache.has(KEY)).toBe(false);
    });

    it('rejects when no code was sent', async () => {
      await expect(service.requestDeletion(7, { code: '123456' })).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.flagForDeletion).not.toHaveBeenCalled();
    });

    it('rejects a wrong code without flagging and counts the attempt', async () => {
      const code = await codeFromEmail();

      await expect(service.requestDeletion(7, { code: wrongCode(code) })).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.flagForDeletion).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      expect((cache.get(KEY) as { attempts: number }).attempts).toBe(1);
    });

    it('burns the code after 5 wrong tries, so even the right code then fails', async () => {
      const code = await codeFromEmail();
      for (let i = 0; i < 5; i++) {
        await expect(service.requestDeletion(7, { code: wrongCode(code) })).rejects.toBeInstanceOf(BadRequestException);
      }

      expect(cache.has(KEY)).toBe(false);
      await expect(service.requestDeletion(7, { code })).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.flagForDeletion).not.toHaveBeenCalled();
    });

    it('counts every wrong guess even when they arrive in parallel', async () => {
      const code = await codeFromEmail();
      const guesses = Array.from({ length: 5 }, () =>
        service.requestDeletion(7, { code: wrongCode(code) }).catch((error: unknown) => error),
      );

      const results = await Promise.all(guesses);

      expect(results.every((r) => r instanceof BadRequestException)).toBe(true);
      expect(cache.has(KEY)).toBe(false);
      await expect(service.requestDeletion(7, { code })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lets only one of two parallel correct submissions through', async () => {
      const code = await codeFromEmail();
      userRepository.flagForDeletion.mockResolvedValue(new Date());

      const results = await Promise.allSettled([
        service.requestDeletion(7, { code, cancel_subscription: true }),
        service.requestDeletion(7, { code, cancel_subscription: true }),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
    });

    it('keeps the code when cancelling the subscription fails, so the user can retry', async () => {
      const code = await codeFromEmail();
      eventEmitter.emitAsync.mockRejectedValueOnce(new Error('stripe down'));
      userRepository.flagForDeletion.mockResolvedValue(new Date());

      await expect(service.requestDeletion(7, { code, cancel_subscription: true })).rejects.toThrow('stripe down');
      eventEmitter.emitAsync.mockResolvedValue([]);
      await expect(service.requestDeletion(7, { code, cancel_subscription: true })).resolves.toBeDefined();
    });

    it('rejects an expired code', async () => {
      const code = await codeFromEmail();
      const stored = cache.get(KEY) as { expires_at: string };
      cache.set(KEY, { ...stored, expires_at: new Date(Date.now() - 1000).toISOString() });

      await expect(service.requestDeletion(7, { code })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws 409 when the account is already flagged', async () => {
      userRepository.findOneBy.mockResolvedValue({ ...flaggable(), deletion_requested_at: new Date() });

      await expect(service.requestDeletion(7, { code: '123456' })).rejects.toBeInstanceOf(ConflictException);
      expect(userRepository.flagForDeletion).not.toHaveBeenCalled();
    });

    it('throws 409 when a concurrent request flagged it first', async () => {
      const code = await codeFromEmail();
      userRepository.flagForDeletion.mockResolvedValue(null);

      await expect(service.requestDeletion(7, { code })).rejects.toBeInstanceOf(ConflictException);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('stops the subscription renewal before flagging when asked to', async () => {
      const code = await codeFromEmail();
      userRepository.flagForDeletion.mockResolvedValue(new Date());

      await service.requestDeletion(7, { code, cancel_subscription: true });

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        CANCEL_SUBSCRIPTION_RENEWAL_EVENT,
        expect.objectContaining({ userId: 7 }),
      );
      expect(eventEmitter.emitAsync.mock.invocationCallOrder[0]).toBeLessThan(
        userRepository.flagForDeletion.mock.invocationCallOrder[0],
      );
    });

    it('does not flag when cancelling the subscription fails', async () => {
      const code = await codeFromEmail();
      eventEmitter.emitAsync.mockRejectedValue(new Error('stripe down'));

      await expect(
        service.requestDeletion(7, { code, cancel_subscription: true }),
      ).rejects.toThrow('stripe down');
      expect(userRepository.flagForDeletion).not.toHaveBeenCalled();
    });
  });

  describe('cancelDeletion', () => {
    it('unflags a flagged account inside the grace period', async () => {
      userRepository.unflagDeletion.mockResolvedValue(true);

      await expect(service.cancelDeletion(7)).resolves.toEqual({ deletion_requested_at: null });
      expect(userRepository.unflagDeletion).toHaveBeenCalledWith(7, 15);
      purgeEmitted(7);
    });

    it('throws 409 when the account is not flagged', async () => {
      userRepository.unflagDeletion.mockResolvedValue(false);
      userRepository.getDeletionState.mockResolvedValue({ flagged: false });

      await expect(service.cancelDeletion(7)).rejects.toThrow('Account deletion was not requested');
      expect(eventEmitter.emit).not.toHaveBeenCalled();
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
      purgeEmitted(7);
    });

    it('throws 409 when the account is already deactivated', async () => {
      userRepository.setActive.mockResolvedValue(false);
      await expect(service.deactivate(7)).rejects.toBeInstanceOf(ConflictException);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('reactivates an inactive account', async () => {
      userRepository.setActive.mockResolvedValue(true);
      await expect(service.reactivate(7)).resolves.toEqual({ is_active: true });
      expect(userRepository.setActive).toHaveBeenCalledWith(7, true);
      purgeEmitted(7);
    });

    it('throws 409 when the account is already active', async () => {
      userRepository.setActive.mockResolvedValue(false);
      await expect(service.reactivate(7)).rejects.toBeInstanceOf(ConflictException);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
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
      userRepository.hasPassword.mockResolvedValue(false);

      // `has_password: false`: an OAuth account, so settings hides "change password".
      await expect(service.findOne(7)).resolves.toEqual({ id: 7, has_password: false });
      expect(userRepository.isPublicAccount).not.toHaveBeenCalled();
    });

    it('never tells another user whether an account has a password', async () => {
      requestService.user = { id: 99, role: { name: 'ADMIN' } };
      userRepository.findById.mockResolvedValue({ id: 7 });

      const result = await service.findOne(7);

      expect(result).not.toHaveProperty('has_password');
      expect(userRepository.hasPassword).not.toHaveBeenCalled();
    });
  });
});
