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
jest.mock('src/common/utils/user-lock', () => ({
  withUserLock: jest.fn(async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
}));

import { buildLogEntry } from '@repo/backend-lib/config/logging';
import { API_ERRORS } from '@repo/common-lib/constants/api-errors';
import { ResponseExceptionFilter } from 'src/common/filters/response-exception.filter';
import type { RequestService } from 'src/common/services/request.service';
import { UserService } from './users.service';

/**
 * AC-15: a rejected reserved rename leaves exactly one `api.error` warn (written by the exception
 * filter) and nothing on the `users` channel: no "Username changed", no error, no secrets.
 */
const SECRET = 'hunter2-secret-password';

const buildService = () => {
  const user = {
    id: 5, username: 'oldname', name: 'Ana', surname: 'Lopez', profession: null,
    username_reset_count: 0, next_username_reset: null,
  };
  const logService = { error: jest.fn(), info: jest.fn(), warn: jest.fn(), critical: jest.fn(), success: jest.fn() };
  const userRepository = {
    findById: jest.fn().mockResolvedValue(user),
    usernameExists: jest.fn().mockResolvedValue(false),
    updateById: jest.fn(),
  };
  const service = new UserService(
    userRepository as never,
    { emit: jest.fn() } as never,
    {} as never,
    { deleteManyCached: jest.fn(), cacheRemember: jest.fn() } as never,
    { user: { id: 5 }, log: () => logService, traceCarrier: () => ({ service: 'api' }) } as never,
    {} as never, {} as never, {} as never, {} as never, {} as never,
    { isReservedForOtherUser: jest.fn().mockResolvedValue(false), reserve: jest.fn(), release: jest.fn() } as never,
  );
  return { service, logService };
};

const runThroughFilter = (error: unknown) => {
  const apiLogger = { warn: jest.fn(), error: jest.fn(), critical: jest.fn(), info: jest.fn() };
  const create = jest.fn().mockReturnValue(apiLogger);
  const filter = new ResponseExceptionFilter({ log: create } as unknown as RequestService);
  const json = jest.fn();
  const response = { status: jest.fn().mockReturnValue({ json }) };
  const request = {
    path: '/v1/users/5', route: { path: '/v1/users/:id' }, headers: {}, params: { id: '5' }, query: {},
    body: { username: 'Atelier', password: SECRET },
  };
  const host = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }) };
  filter.catch(error, host as never);
  return { apiLogger, create, response, json };
};

describe('reserved username rename logging (AC-15)', () => {
  it('AC-15: the service writes no users-channel line at all when it rejects the rename', async () => {
    const { service, logService } = buildService();

    await expect(service.update(5, { username: 'Atelier' } as never)).rejects.toMatchObject({
      API_ERROR_CODE: API_ERRORS.USERNAME_RESERVED,
    });

    for (const level of ['info', 'warn', 'error', 'critical', 'success'] as const) {
      expect(logService[level]).not.toHaveBeenCalled();
    }
  });

  it('AC-15: the exception filter writes exactly one api.error line, at warn, with 400 and the error code', async () => {
    const { service } = buildService();
    const error = await service.update(5, { username: 'Atelier' } as never).catch((e: unknown) => e);

    const { apiLogger, create, response } = runThroughFilter(error);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toBe('api.error');
    expect(apiLogger.warn).toHaveBeenCalledTimes(1);
    expect(apiLogger.error).not.toHaveBeenCalled();
    expect(apiLogger.critical).not.toHaveBeenCalled();
    expect(apiLogger.warn.mock.calls[0][1]).toMatchObject({
      status_code: 400,
      api_error_code: 'USERNAME_RESERVED',
    });
    expect(response.status).toHaveBeenCalledWith(400);
  });

  it('AC-15: no password, token or cookie lands in the written line (the entry builder redacts the logged context)', async () => {
    const { service } = buildService();
    const error = await service.update(5, { username: 'Atelier' } as never).catch((e: unknown) => e);

    const { apiLogger } = runThroughFilter(error);

    const [message, context] = apiLogger.warn.mock.calls[0] as [string, Record<string, unknown>];
    const entry = buildLogEntry({
      logOptions: { channel: 'api.error', ...context },
      timestamp: new Date(),
      id: 'req-1',
      level: 'WARN',
      message,
      format: 'json',
      service: 'api',
    } as never);
    const serialized = JSON.stringify(entry);
    expect(serialized).not.toContain(SECRET);
    expect(serialized).toContain('USERNAME_RESERVED');
    expect(serialized.toLowerCase()).not.toContain('authorization');
    expect(serialized.toLowerCase()).not.toContain('cookie');
  });
});
