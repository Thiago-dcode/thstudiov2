import { EventEmitter } from 'events';
import { logService } from '@repo/backend-lib/config/logging';
import { ConfigService } from '@nestjs/config';
import type { LogService } from '@repo/backend-lib/services/log-service';
import { RequestService } from 'src/common/services/request.service';
import { requestStorage } from 'src/common/services/request-storage';
import { ACCESS_LOG_CHANNEL, RequestMiddleware } from './request.middleware';

const setup = () => {
  const fake = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const create = jest.spyOn(logService, 'api').mockReturnValue(fake as unknown as LogService);
  const requestService = new RequestService(requestStorage);
  const middleware = new RequestMiddleware(requestService, { get: jest.fn() } as unknown as ConfigService);
  return { fake, create, middleware };
};

const makeReq = () => {
  const headers: Record<string, string> = { 'user-agent': 'jest' };
  return {
    method: 'GET',
    originalUrl: '/api/v1/x',
    headers,
    query: {},
    params: {},
    route: { path: '/api/v1/x' },
    ip: '1.1.1.1',
    get: (n: string) => headers[n.toLowerCase()],
  } as any;
};

const makeRes = (statusCode: number) => {
  const res: any = new EventEmitter();
  res.statusCode = statusCode;
  res.writableFinished = true;
  res.setHeader = jest.fn();
  return res;
};

describe('RequestMiddleware access line fields', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-24: ACCESS_LOG_CHANNEL is api.access and the dedicated logger uses it', () => {
    const { create } = setup();
    expect(ACCESS_LOG_CHANNEL).toBe('api.access');
    expect(create.mock.calls[0][0]?.channel).toBe('api.access');
  });

  it.each([
    [200, 'info'],
    [404, 'warn'],
    [503, 'error'],
  ] as const)('AC-24: a %i access line passes { status_code } as the third argument', async (status, level) => {
    const { middleware, fake } = setup();
    const res = makeRes(status);
    await middleware.use(makeReq(), res, jest.fn());
    res.emit('close');
    const call = fake[level].mock.calls[0];
    expect(call[2]).toEqual({ status_code: status });
    expect(Object.keys(call[1])).toEqual(['route', 'status_code', 'duration_ms', 'aborted']);
  });
});
