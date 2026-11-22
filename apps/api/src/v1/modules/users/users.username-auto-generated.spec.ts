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
// Runs the critical sections one after another (like the Redis lock would) and records the key.
const lockKeys: string[] = [];
let lockTail: Promise<unknown> = Promise.resolve();
jest.mock('src/common/utils/user-lock', () => ({
  withUserLock: jest.fn((key: string, _ttl: number, fn: () => Promise<unknown>) => {
    lockKeys.push(key);
    const run = lockTail.then(fn, fn);
    lockTail = run.catch(() => undefined);
    return run;
  }),
}));

import { API_ERRORS } from '@repo/common-lib/constants/api-errors';
import { DbUniqueViolationException } from '@repo/database/exceptions';
import { MAX_USERNAME_RESET } from '@repo/common-lib/constants/limits';
import { UserService } from './users.service';

type Row = {
  id: number;
  username: string;
  name: string | null;
  surname: string | null;
  profession: string | null;
  short_biography: string | null;
  avatar: string | null;
  banner: string | null;
  username_reset_count: number;
  next_username_reset: Date | null;
  username_auto_generated: boolean;
  funnel_step: number;
};

const baseUser: Row = {
  id: 5,
  username: 'artistab12cd34',
  name: null,
  surname: null,
  profession: null,
  short_biography: null,
  avatar: null,
  banner: null,
  username_reset_count: 0,
  next_username_reset: null,
  username_auto_generated: true,
  funnel_step: 1,
};

const build = (
  user: Partial<Row> = {},
  caller: Record<string, unknown> = { id: 5 },
) => {
  // The "database": updateById writes into it, so a second PATCH sees the first one's result.
  const db: Row = { ...baseUser, ...user };
  const userRepository = {
    findById: jest.fn(async () => ({ ...db })),
    hasPassword: jest.fn().mockResolvedValue(true),
    usernameExists: jest.fn().mockResolvedValue(false),
    updateById: jest.fn(async (_id: number, data: Partial<Row>) => {
      Object.assign(db, data);
      return { ...db };
    }),
  };
  const usernameHistoryRepository = {
    isReservedForOtherUser: jest.fn().mockResolvedValue(false),
    reserve: jest.fn(),
    release: jest.fn(),
  };
  const helpers = { deleteManyCached: jest.fn().mockResolvedValue(undefined), deleteCached: jest.fn() };
  const logService = { error: jest.fn(), info: jest.fn() };
  const eventEmitter = { emit: jest.fn() };
  const service = new UserService(
    userRepository as never,
    eventEmitter as never,
    {} as never, // mailService
    helpers as never,
    { user: caller, log: () => logService, traceCarrier: () => ({ service: 'api' }) } as never, // requestService
    {} as never, // notifyNewUserMail
    {} as never, // aiService
    {} as never, // profileStatusService
    {} as never, // userSessionsService
    {} as never, // tempUploads
    usernameHistoryRepository as never,
  );
  const save = (request: Record<string, unknown>) => service.update(5, request as never);
  return { db, service, save, userRepository, usernameHistoryRepository, helpers, logService, eventEmitter };
};

const lastUpdateData = (updateById: jest.Mock) =>
  updateById.mock.calls[updateById.mock.calls.length - 1][1] as Record<string, unknown>;

describe('UserService.update: free first rename of a generated username', () => {
  beforeEach(() => {
    lockKeys.length = 0;
    lockTail = Promise.resolve();
  });

  it('renames past the monthly limit, keeps the count and clears the flag', async () => {
    const { save, userRepository } = build({
      username_reset_count: MAX_USERNAME_RESET,
      next_username_reset: new Date(Date.now() + 86_400_000),
    });

    await save({ username: 'chosenname' });

    const data = lastUpdateData(userRepository.updateById);
    expect(data).toMatchObject({ username: 'chosenname', username_auto_generated: false });
    expect(data).not.toHaveProperty('username_reset_count');
    expect(lockKeys).toEqual(['username-change:5']);
  });

  it('the rename after the free one counts against the limit', async () => {
    const { save, userRepository } = build();

    await save({ username: 'firstname' });
    await save({ username: 'secondname' });

    expect(lastUpdateData(userRepository.updateById)).toMatchObject({
      username: 'secondname',
      username_reset_count: 1,
    });
  });

  it('a chosen username at the limit is still refused', async () => {
    const { save, userRepository } = build({
      username_auto_generated: false,
      username_reset_count: MAX_USERNAME_RESET,
      next_username_reset: new Date(Date.now() + 86_400_000),
    });

    await expect(save({ username: 'chosenname' })).rejects.toThrow('Username change limit reached');
    expect(userRepository.updateById).not.toHaveBeenCalled();
  });

  it('still reserves the old username for its redirects', async () => {
    const { save, usernameHistoryRepository } = build();

    await save({ username: 'chosenname' });

    expect(usernameHistoryRepository.reserve).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 5, username: 'artistab12cd34' }),
    );
  });

  it('a rename that loses the race to the unique index answers 409 and reserves nothing', async () => {
    const { save, userRepository, usernameHistoryRepository } = build();
    userRepository.updateById.mockRejectedValueOnce(
      Object.assign(Object.create(DbUniqueViolationException.prototype), { message: 'duplicate' }),
    );

    await expect(save({ username: 'chosenname' })).rejects.toMatchObject({
      API_ERROR_CODE: API_ERRORS.USERNAME_TAKEN,
      status: 409,
    });
    expect(usernameHistoryRepository.reserve).not.toHaveBeenCalled();
  });

  it('a name already held answers 409 with the USERNAME_TAKEN code, before any write', async () => {
    const { save, userRepository } = build();
    userRepository.usernameExists.mockResolvedValue(true);

    await expect(save({ username: 'thiago' })).rejects.toMatchObject({
      API_ERROR_CODE: API_ERRORS.USERNAME_TAKEN,
      status: 409,
      message: 'Username is already taken',
    });
    expect(userRepository.updateById).not.toHaveBeenCalled();
  });

  it('a name save leaves the generated username and the flag alone, without the lock', async () => {
    const { save, userRepository } = build();

    await save({ name: 'Ana', surname: 'Silva' });

    const data = lastUpdateData(userRepository.updateById);
    expect(data).not.toHaveProperty('username');
    expect(data).not.toHaveProperty('username_auto_generated');
    expect(lockKeys).toEqual([]);
  });

  it('AC-11: another user (admin) reading the row does not see the flag; the owner does', async () => {
    const asOther = build({}, { id: 99, role: { name: 'ADMIN' } });
    const asOwner = build({}, { id: 5 });

    const other = await asOther.service.findOne(5);
    const owner = await asOwner.service.findOne(5);

    expect(other).not.toHaveProperty('username_auto_generated');
    expect(owner).toHaveProperty('username_auto_generated', true);
  });
});

describe('UserService.usernameBase', () => {
  it.each([
    ['Ana Silva', 'anasilva'],
    ["  José O'Brien ", 'joseobrien'],
    ['Иван', ''],
    ['   ', ''],
    ['', ''],
    [null, ''],
    [undefined, ''],
    ['Maximiliano Alessandro', 'maximilianoa'],
  ])('%p → %p', (prefix: string | null | undefined, base: string) => {
    expect(UserService.usernameBase(prefix)).toBe(base);
  });

  it('generateUniqueUsername uses the same base, falling back to "user" when it is empty', async () => {
    const { service } = build();

    await expect(service.generateUniqueUsername('Ana Silva')).resolves.toMatch(/^anasilva[a-z0-9]{8}$/);
    await expect(service.generateUniqueUsername('Иван')).resolves.toMatch(/^user[a-z0-9]{8}$/);
  });
});
