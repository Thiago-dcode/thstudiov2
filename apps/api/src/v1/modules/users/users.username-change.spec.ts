// `users.service` builds a Stripe client at import time; CI has no key to build it with.
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));
jest.mock('@repo/backend-lib/utils', () => ({
  ...jest.requireActual('@repo/backend-lib/utils'),
  QueueHelper: {
    createGenerateSingleEntityMetadataJob: jest.fn(),
    createOrUpdateEmailPreferenceJob: jest.fn(),
  },
}));
// Runs the critical section inline and records the key, without a Redis connection.
const lockKeys: string[] = [];
jest.mock('src/common/utils/user-lock', () => ({
  withUserLock: jest.fn(async (key: string, _ttl: number, fn: () => Promise<unknown>) => {
    lockKeys.push(key);
    return fn();
  }),
}));

import { addDays, addMonths, subDays } from 'date-fns';
import { CACHE_KEY_USERNAME_EXISTS } from '@repo/common-lib/constants/cache';
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from '@repo/common-lib/constants/events';
import { MAX_USERNAME_RESET, USERNAME_RESERVATION_DAYS } from '@repo/common-lib/constants/limits';
import { UserService } from './users.service';

const baseUser = {
  id: 5,
  username: 'oldname',
  name: 'Ana',
  surname: 'Lopez',
  profession: 'Photographer',
  short_biography: null,
  avatar: null,
  banner: null,
  username_reset_count: 0,
  next_username_reset: null as Date | null,
};

const build = (user: Partial<typeof baseUser> = {}) => {
  const current = { ...baseUser, ...user };
  const userRepository = {
    findById: jest.fn().mockResolvedValue(current),
    usernameExists: jest.fn().mockResolvedValue(false),
    updateById: jest.fn(async (_id: number, data: object) => ({ ...current, ...data })),
  };
  const usernameHistoryRepository = {
    isReservedForOtherUser: jest.fn().mockResolvedValue(false),
    reserve: jest.fn(),
    release: jest.fn(),
    findRedirect: jest.fn().mockResolvedValue({ username: 'newname' }),
  };
  const helpers = { deleteManyCached: jest.fn().mockResolvedValue(undefined), cacheRemember: jest.fn() };
  const logService = { name: jest.fn().mockReturnThis(), error: jest.fn(), info: jest.fn() };
  const eventEmitter = { emit: jest.fn() };
  const service = new UserService(
    userRepository as never,
    eventEmitter as never,
    logService as never,
    {} as never, // mailService
    helpers as never,
    { user: { id: current.id } } as never, // requestService
    {} as never, // notifyNewUserMail
    {} as never, // aiService
    {} as never, // profileStatusService
    {} as never, // userSessionsService
    {} as never, // tempUploads
    usernameHistoryRepository as never,
  );
  const rename = (username: string) => service.update(current.id, { username } as never);
  return { service, rename, userRepository, usernameHistoryRepository, helpers, logService, eventEmitter };
};

describe('UserService.update — username changes', () => {
  it('reserves the old username for 90 days and clears both names from the cache', async () => {
    const { rename, usernameHistoryRepository, helpers } = build();

    await rename('newname');

    expect(usernameHistoryRepository.reserve).toHaveBeenCalledTimes(1);
    const [{ user_id, username, reserved_until }] = usernameHistoryRepository.reserve.mock.calls[0];
    expect({ user_id, username }).toEqual({ user_id: 5, username: 'oldname' });
    const expected = addDays(new Date(), USERNAME_RESERVATION_DAYS).getTime();
    expect(Math.abs((reserved_until as Date).getTime() - expected)).toBeLessThan(5000);
    expect(helpers.deleteManyCached).toHaveBeenCalledWith(
      expect.arrayContaining([CACHE_KEY_USERNAME_EXISTS('oldname'), CACHE_KEY_USERNAME_EXISTS('newname')]),
    );
  });

  it('serialises username changes per user, so two parallel renames cannot both pass the monthly count', async () => {
    lockKeys.length = 0;
    const { rename, service } = build();

    await rename('newname');
    await service.update(5, { name: 'Ana' } as never);

    expect(lockKeys).toEqual(['username-change:5']);
  });

  it('refuses a name another user is still holding', async () => {
    const { rename, userRepository, usernameHistoryRepository } = build();
    usernameHistoryRepository.isReservedForOtherUser.mockResolvedValue(true);

    await expect(rename('heldname')).rejects.toThrow('Username is already taken');
    expect(usernameHistoryRepository.isReservedForOtherUser).toHaveBeenCalledWith('heldname', 5);
    expect(userRepository.updateById).not.toHaveBeenCalled();
    expect(usernameHistoryRepository.reserve).not.toHaveBeenCalled();
  });

  it('lets a user take back their own reserved name and drops that reservation', async () => {
    const { rename, userRepository, usernameHistoryRepository } = build();

    await rename('mypastname');

    // Their own reservation is excluded by user id, so the check passes.
    expect(usernameHistoryRepository.isReservedForOtherUser).toHaveBeenCalledWith('mypastname', 5);
    expect(userRepository.updateById).toHaveBeenCalled();
    expect(usernameHistoryRepository.release).toHaveBeenCalledWith(5, 'mypastname');
  });

  it(`allows at most ${MAX_USERNAME_RESET} changes per period`, async () => {
    const { rename, userRepository } = build({
      username_reset_count: MAX_USERNAME_RESET,
      next_username_reset: addDays(new Date(), 10),
    });

    await expect(rename('another')).rejects.toThrow('Username change limit reached (2 per month)');
    expect(userRepository.updateById).not.toHaveBeenCalled();
  });

  it('counts the second change and keeps the period window', async () => {
    const resetAt = addDays(new Date(), 10);
    const { rename, userRepository } = build({ username_reset_count: 1, next_username_reset: resetAt });

    await rename('second');

    const [, data] = userRepository.updateById.mock.calls[0];
    expect(data).toMatchObject({ username: 'second', username_reset_count: 2 });
    expect(data).not.toHaveProperty('next_username_reset');
  });

  it('starts a new period once the previous one has ended', async () => {
    const { rename, userRepository } = build({
      username_reset_count: MAX_USERNAME_RESET,
      next_username_reset: subDays(new Date(), 1),
    });

    await rename('fresh');

    const [, data] = userRepository.updateById.mock.calls[0] as [number, { username_reset_count: number; next_username_reset: Date }];
    expect(data.username_reset_count).toBe(1);
    expect(Math.abs(data.next_username_reset.getTime() - addMonths(new Date(), 1).getTime())).toBeLessThan(5000);
  });

  it('purges the edge cache of both names, after the reservation is written', async () => {
    const { rename, usernameHistoryRepository, eventEmitter } = build();

    await rename('newname');

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      expect.objectContaining({ userId: 5, usernames: ['oldname', 'newname'] }),
    );
    const purgeCall = eventEmitter.emit.mock.calls.findIndex(
      ([name]) => name === ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
    );
    expect(eventEmitter.emit.mock.invocationCallOrder[purgeCall]).toBeGreaterThan(
      usernameHistoryRepository.reserve.mock.invocationCallOrder[0],
    );
  });

  it('purges by user id alone on an edit that keeps the username', async () => {
    const { service, eventEmitter } = build();

    await service.update(5, { name: 'Ana Maria' } as never);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      expect.objectContaining({ userId: 5, usernames: undefined }),
    );
  });

  it('touches no reservation when the username is unchanged', async () => {
    const { rename, usernameHistoryRepository } = build();

    await rename('oldname');

    expect(usernameHistoryRepository.reserve).not.toHaveBeenCalled();
    expect(usernameHistoryRepository.isReservedForOtherUser).not.toHaveBeenCalled();
  });
});

describe('UserService.findUsernameRedirect', () => {
  // A cached answer would keep revealing a banned or deactivated owner's new name.
  it('asks the repository every time, never a cache', async () => {
    const { service, usernameHistoryRepository, helpers } = build();

    await expect(service.findUsernameRedirect('oldname')).resolves.toEqual({ username: 'newname' });
    await service.findUsernameRedirect('oldname');

    expect(usernameHistoryRepository.findRedirect).toHaveBeenCalledTimes(2);
    expect(helpers.cacheRemember).not.toHaveBeenCalled();
  });
});

describe('UserService.handleNewUserEvent', () => {
  const event = { user: { id: 9, username: 'freshname', email: 'fresh@example.test' } };
  // The first onboarding step throws a sentinel: reaching it proves the cache clear did not stop
  // the onboarding, without standing up Stripe, plans and mail for this spec.
  const reachedOnboarding = new Error('reached onboarding');
  beforeEach(() => {
    const { QueueHelper } = jest.requireMock('@repo/backend-lib/utils');
    QueueHelper.createOrUpdateEmailPreferenceJob.mockRejectedValue(reachedOnboarding);
  });

  it('clears the cached "does not exist" for the new username', async () => {
    const { service, helpers } = build();

    await expect(service.handleNewUserEvent(event as never)).rejects.toBe(reachedOnboarding);

    expect(helpers.deleteManyCached).toHaveBeenCalledWith([CACHE_KEY_USERNAME_EXISTS('freshname')]);
  });

  it('logs a failed cache clear and still runs the onboarding', async () => {
    const { service, helpers, logService } = build();
    helpers.deleteManyCached.mockRejectedValueOnce(new Error('redis down'));

    await expect(service.handleNewUserEvent(event as never)).rejects.toBe(reachedOnboarding);

    expect(logService.error).toHaveBeenCalledWith(
      expect.stringContaining('username cache clear failed'),
      expect.any(Error),
    );
  });
});
