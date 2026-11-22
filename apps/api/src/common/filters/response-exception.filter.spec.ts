import { BadRequestException, HttpException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { consoleRequestService } from 'src/common/testing/console-logger';
import { ResponseExceptionFilter } from './response-exception.filter';
import { RequestService } from '../services/request.service';

const setup = () => {
  // The channel is set in the config now (`api.error`), so the level methods are on the logger itself.
  const logger: any = { warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
  const channelLogger = logger;
  const create = jest.fn().mockReturnValue(logger);
  const requestService = { log: create } as unknown as RequestService;
  const filter = new ResponseExceptionFilter(requestService);
  const json = jest.fn();
  const response: any = { status: jest.fn().mockReturnValue({ json }) };
  const request: any = { path: '/v1/x', headers: {}, body: { a: 1 }, params: {}, query: {} };
  const host: any = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }) };
  return { filter, create, requestService, channelLogger, logger, response, json, host };
};

describe('ResponseExceptionFilter request binding', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-13: the logger is the request logger on api.error (id and context read per line by RequestService)', () => {
    const { filter, create, host } = setup();
    filter.catch(new NotFoundException('nope'), host);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toBe('api.error');
  });

  it('AC-13: logs 4xx at warn with status_code and keeps the response shape', () => {
    const { filter, logger, channelLogger, response, json, host } = setup();
    filter.catch(new BadRequestException('bad'), host);
    expect(channelLogger.warn).toHaveBeenCalledTimes(1);
    expect(channelLogger.warn.mock.calls[0][1]).toMatchObject({ status_code: 400 });
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

  it('a 404 is not logged by the filter (the access line has it, so a ?token= in its message never reaches a log) but still answers 404', () => {
    const { filter, channelLogger, response, host } = setup();
    filter.catch(new NotFoundException('Cannot GET /nope?token=SECRETQ'), host);
    expect(channelLogger.warn).not.toHaveBeenCalled();
    expect(channelLogger.critical).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(404);
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
    create.mockImplementation(consoleRequestService().log);
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
    expect(JSON.parse(lines[0]).level).toBe(level.toUpperCase());
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

  it('AC-13: the outer fallback logger is the request logger too', () => {
    const { filter, create, response, host } = setup();
    // Make the main path throw after logging so the outer catch runs.
    response.status.mockImplementationOnce(() => {
      throw new Error('response broke');
    });
    filter.catch(new NotFoundException('x'), host);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0]).toBe('api.error');
  });
});
