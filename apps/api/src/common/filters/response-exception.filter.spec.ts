import { BadRequestException, HttpException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { logService } from '@repo/backend-lib/config/logging';
import type { LogService } from '@repo/backend-lib/services/log-service';
import { consoleLogger } from 'src/common/testing/console-logger';
import { currentRequestId, currentRequestLogContext } from '../services/request-storage';
import { ResponseExceptionFilter } from './response-exception.filter';
import { RequestService } from '../services/request.service';

const setup = () => {
  // The channel is set in the config now (`api.error`), so the level methods are on the logger itself.
  const logger: any = { channel: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
  const channelLogger = logger;
  const create = jest.spyOn(logService, 'api').mockReturnValue(logger as LogService);
  const binding = { id: currentRequestId, request: currentRequestLogContext };
  const requestService = {} as unknown as RequestService;
  const filter = new ResponseExceptionFilter(requestService);
  const json = jest.fn();
  const response: any = { status: jest.fn().mockReturnValue({ json }) };
  const request: any = { path: '/v1/x', headers: {}, body: { a: 1 }, params: {}, query: {} };
  const host: any = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }) };
  return { filter, create, binding, requestService, channelLogger, logger, response, json, host };
};

describe('ResponseExceptionFilter request binding', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-13: the logger is an api logger: service api, the request id and context read per line', () => {
    const { filter, create, binding, host } = setup();
    filter.catch(new NotFoundException('nope'), host);
    expect(create).toHaveBeenCalledTimes(1);
    // `logService.api` is the spy: the service is the factory's.
    const [cfg = {}] = create.mock.calls[0];
    expect(cfg.id).toBe(binding.id);
    expect(cfg.request).toBe(binding.request);
    expect(cfg.channel).toBe('api.error');
  });

  it('AC-13: logs 4xx at warn with status_code and keeps the response shape', () => {
    const { filter, logger, channelLogger, response, json, host } = setup();
    filter.catch(new BadRequestException('bad'), host);
    expect(logger.channel).not.toHaveBeenCalled();
    expect(channelLogger.warn).toHaveBeenCalledTimes(1);
    expect(channelLogger.warn.mock.calls[0][2]).toEqual({ status_code: 400 });
    expect(response.status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0].error.status_code).toBe(400);
    expect(json.mock.calls[0][0].data).toBeNull();
  });

  it('AC-13: an unexpected error logs at critical level and answers 500', () => {
    const { filter, channelLogger, response, json, host } = setup();
    filter.catch(new Error('db exploded'), host);
    expect(channelLogger.critical).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0].error.message).toBe('Internal Server Error');
  });

  it('AC-13: a 404 strips the ?query from the logged message and errors', () => {
    const { filter, channelLogger, host } = setup();
    filter.catch(new NotFoundException('Cannot GET /api/v1/does-not-exist?token=SECRETQ'), host);
    expect(channelLogger.warn).toHaveBeenCalledTimes(1);
    const [message, context] = channelLogger.warn.mock.calls[0];
    expect(message).toBe('Cannot GET /api/v1/does-not-exist');
    expect(context.message).toBe('Cannot GET /api/v1/does-not-exist');
    expect(context.errors).toEqual(['Cannot GET /api/v1/does-not-exist']);
    expect(JSON.stringify(channelLogger.warn.mock.calls[0])).not.toContain('SECRETQ');
  });

  it('AC-13: non-404 messages are left untouched', () => {
    const { filter, channelLogger, host } = setup();
    filter.catch(new BadRequestException('bad value?x=1'), host);
    expect(channelLogger.warn.mock.calls[0][0]).toBe('bad value?x=1');
  });

  it.each([
    ['429', () => new HttpException('Too Many Requests', 429), 'warn'],
    ['500 unexpected', () => new Error('boom'), 'critical'],
    ['500 http', () => new InternalServerErrorException('boom'), 'critical'],
  ] as const)('AC-19: a %s on a secret path param route never logs the secret', (_n, make, level) => {
    const { filter, create, host } = setup();
    // Real logger (console driver): key redaction of params/query happens inside LogService.
    create.mockImplementation((cfg = {}) => consoleLogger(cfg));
    const out = [jest.spyOn(console, 'warn'), jest.spyOn(console, 'error'), jest.spyOn(console, 'log')];
    out.forEach((s) => s.mockImplementation(() => undefined));
    const request = host.switchToHttp().getRequest();
    request.path = '/api/v1/email-preferences/SECRETP/token';
    request.originalUrl = '/api/v1/email-preferences/SECRETP/token?token=SECRETQ';
    request.route = { path: '/api/v1/email-preferences/:token/token' };
    request.params = { token: 'SECRETP' };
    request.query = { token: 'SECRETQ' };
    filter.catch(make(), host);
    const lines = out.flatMap((s) => s.mock.calls.map((c) => String(c[0])));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain(level.toUpperCase());
    expect(lines[0]).not.toContain('SECRETP');
    expect(lines[0]).not.toContain('SECRETQ');
    expect(JSON.parse(lines[0]).extraInfo.path).toBe('/api/v1/email-preferences/:token/token');
  });

  it('AC-19: the logged extraInfo.path is masked while the client body keeps the real path', () => {
    const { filter, channelLogger, json, host } = setup();
    const request = host.switchToHttp().getRequest();
    request.path = '/api/v1/email-preferences/SECRETP/token';
    request.route = { path: '/api/v1/email-preferences/:token/token' };
    request.params = { token: 'SECRETP' };
    filter.catch(new HttpException('Too Many Requests', 429), host);
    const context = channelLogger.warn.mock.calls[0][1];
    expect(context.path).not.toContain('SECRETP');
    expect(json.mock.calls[0][0].error.path).toBe('/api/v1/email-preferences/SECRETP/token');
  });

  it('AC-13: the outer fallback logger is an api logger too', () => {
    const { filter, create, binding, response, host } = setup();
    // Make the main path throw after logging so the outer catch runs.
    response.status.mockImplementationOnce(() => {
      throw new Error('response broke');
    });
    filter.catch(new NotFoundException('x'), host);
    expect(create).toHaveBeenCalledTimes(2);
    const cfg = create.mock.calls[1][0] ?? {};
    expect(cfg.id).toBe(binding.id);
    expect(cfg.request).toBe(binding.request);
  });
});
