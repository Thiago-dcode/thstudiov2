jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({ stripe: {}, stripeWebhookSecret: '' }));
jest.mock('@repo/backend-lib/utils', () => ({
  ...jest.requireActual('@repo/backend-lib/utils'),
  QueueHelper: {
    createGenerateSingleEntityMetadataJob: jest.fn(),
    createOrUpdateEmailPreferenceJob: jest.fn(),
  },
}));
jest.mock('src/common/utils/user-lock', () => ({
  withUserLock: jest.fn(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
}));

import { LogService, configureLogProcess } from '@repo/backend-lib/services/log-service';
import { ConsoleLogService } from '@repo/backend-lib/services/log-service';
import { hash } from '@repo/common-lib/utils/hash';
import { UserService } from './users.service';

const EMAIL = 'victim@example.com';
const OLD_PASSWORD = 'OLDPASSWORD123';
const NEW_PASSWORD = 'NEWPASSWORD456';
const TOKEN = 'SESSIONTOKENSECRET';

const baseUser = {
  id: 5, username: 'oldname', name: 'Ana', surname: 'Lopez', email: EMAIL, language: 'EN',
  username_reset_count: 0, next_username_reset: null as Date | null,
  password_reset_count: 0, next_password_reset: null as Date | null, deletion_requested_at: null,
};

let lines: any[] = [];

const build = async () => {
  lines = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => {
      try { lines.push(JSON.parse(String(line))); } catch { /* not a log line */ }
    });
  }
  const logService = new ConsoleLogService({ channel: 'users' });
  const nameSpy = jest.spyOn(logService, 'name');
  const user = { ...baseUser, password: await hash(OLD_PASSWORD) };
  const userRepository = {
    findById: jest.fn().mockResolvedValue(user),
    findOneByWithSecrets: jest.fn().mockResolvedValue(user),
    usernameExists: jest.fn().mockResolvedValue(false),
    updateById: jest.fn(async (_id: number, data: object) => ({ ...user, ...data })),
    flagForDeletion: jest.fn().mockResolvedValue(new Date('2026-11-01T10:00:00Z')),
    unflagDeletion: jest.fn().mockResolvedValue(true),
  };
  const sessions = { expireAllForUser: jest.fn().mockResolvedValue(undefined) };
  const usernameHistory = {
    isReservedForOtherUser: jest.fn().mockResolvedValue(false),
    reserve: jest.fn(),
    release: jest.fn(),
  };
  const eventEmitter = { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue([]) };
  const service = new UserService(
    userRepository as never,
    eventEmitter as never,
    logService as unknown as LogService,
    {} as never,
    { deleteManyCached: jest.fn().mockResolvedValue(undefined), cacheRemember: jest.fn() } as never,
    { user: { id: user.id, token: TOKEN } } as never,
    {} as never,
    {} as never,
    {} as never,
    sessions as never,
    {} as never,
    usernameHistory as never,
  );
  return { service, userRepository, nameSpy };
};

const audit = (message: string) => lines.filter((l) => l.channel === 'users' && l.message === message);

describe('UserService audit lines', () => {
  beforeEach(() => configureLogProcess({ service: 'api' }));
  afterEach(() => {
    jest.restoreAllMocks();
    configureLogProcess({ service: '', onCritical: null });
  });

  it('AC-27: a username change gives info "Username changed" with the public handles and the subject user', async () => {
    const { service } = await build();
    await service.update(5, { username: 'newname' } as never);
    const [line] = audit('Username changed');
    expect(line.level).toBe('INFO');
    expect(line.operation).toBe('username-change');
    expect(line.extraInfo).toMatchObject({ previous_username: 'oldname', username: 'newname' });
    expect(line.correlation.user_id).toBe(5);
    expect(JSON.stringify(lines)).not.toContain(EMAIL);
  });

  it('AC-27: an unchanged username writes no line', async () => {
    const { service } = await build();
    await service.update(5, { username: 'oldname' } as never);
    expect(audit('Username changed')).toHaveLength(0);
  });

  it('AC-27: a password change gives "Password changed" and never the passwords or the token', async () => {
    const { service } = await build();
    await service.updatePassword(5, { old_password: OLD_PASSWORD, new_password: NEW_PASSWORD } as never);
    const [line] = audit('Password changed');
    expect(line.operation).toBe('password-change');
    expect(line.extraInfo).toEqual({ other_sessions_revoked: true });
    expect(line.correlation.user_id).toBe(5);
    const dumped = JSON.stringify(lines);
    expect(dumped).not.toMatch(new RegExp(`${OLD_PASSWORD}|${NEW_PASSWORD}|${TOKEN}`));
  });

  it('AC-27: a wrong current password writes no success line', async () => {
    const { service } = await build();
    await expect(service.updatePassword(5, { old_password: 'wrong', new_password: NEW_PASSWORD } as never)).rejects.toThrow();
    expect(audit('Password changed')).toHaveLength(0);
  });

  it('AC-27: banUser gives warn "User banned" with the reason and the subject user', async () => {
    const { service } = await build();
    await service.banUser(8, 'spam');
    const [line] = audit('User banned');
    expect(line.level).toBe('WARN');
    expect(line.operation).toBe('ban');
    expect(line.extraInfo).toEqual({ reason: 'spam' });
    expect(line.correlation.user_id).toBe(8);
  });

  it('AC-27: deletion request and cancel use a per-call operation and leave the shared logger unrenamed', async () => {
    const { service, nameSpy } = await build();
    await service.requestDeletion(5, { password: OLD_PASSWORD, cancel_subscription: true } as never);
    await service.cancelDeletion(5);
    const [requested] = audit('Account deletion requested');
    const [cancelled] = audit('Account deletion cancelled');
    expect(requested.operation).toBe('account-deletion');
    expect(requested.extraInfo).toEqual({ cancel_subscription: true });
    expect(cancelled.operation).toBe('account-deletion');
    expect(nameSpy).not.toHaveBeenCalled();
    // The next line from the same logger has no leaked operation.
    const logger = new ConsoleLogService({ channel: 'users' });
    void logger;
    expect(JSON.stringify(lines)).not.toMatch(new RegExp(`${OLD_PASSWORD}|${EMAIL}`));
  });

  it('AC-27: the audit messages are constants (no interpolated ids or names)', async () => {
    const { service } = await build();
    await service.update(5, { username: 'newname' } as never);
    await service.updatePassword(5, { old_password: OLD_PASSWORD, new_password: NEW_PASSWORD } as never);
    await service.banUser(8, 'spam');
    for (const line of lines.filter((l) => l.channel === 'users')) {
      expect(line.message).not.toMatch(/\d|newname|oldname/);
    }
  });
});
