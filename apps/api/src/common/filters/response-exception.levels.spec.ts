import { BadRequestException, HttpException } from '@nestjs/common';
import { logBuffer } from '@repo/backend-lib/config/logging';
import { ResponseExceptionFilter } from './response-exception.filter';
import { RequestService } from '../services/request.service';

const setup = () => {
  const logger: any = { warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
  const create = jest.fn().mockReturnValue(logger);
  const requestService = { log: create } as unknown as RequestService;
  const filter = new ResponseExceptionFilter(requestService);
  const json = jest.fn();
  const response: any = { status: jest.fn().mockReturnValue({ json }) };
  const request: any = { path: '/v1/x', headers: {}, body: { a: 1 }, params: {}, query: {} };
  const host: any = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }) };
  return { filter, create, logger, response, json, host };
};

describe('ResponseExceptionFilter levels (every 5xx is critical)', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([400, 401, 403, 409, 422, 429])('AC-23: %i logs warn with status_code, never critical', (status) => {
    const { filter, logger, host, response } = setup();
    host.switchToHttp().getRequest().route = { path: '/x' };
    filter.catch(new HttpException('client error', status), host);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][1]).toMatchObject({ status_code: status });
    expect(logger.critical).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(status);
  });

  it.each([500, 501, 502, 503, 504, 511])('AC-23: %i logs critical with status_code, never warn', (status) => {
    const { filter, logger, host, response } = setup();
    filter.catch(new HttpException('server error', status), host);
    expect(logger.critical).toHaveBeenCalledTimes(1);
    expect(logger.critical.mock.calls[0][1]).toMatchObject({ status_code: status });
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(status);
  });

  it('AC-23: a 503 produces exactly one critical line (one alert) on channel api.error', () => {
    const { filter, create, logger, host } = setup();
    filter.catch(new HttpException('Service Unavailable', 503), host);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toBe('api.error');
    expect(logger.critical).toHaveBeenCalledTimes(1);
    expect(logger.critical.mock.calls[0][0]).toBe('Service Unavailable');
  });

  it('AC-23: an unknown thrown value is a 500 critical', () => {
    const { filter, logger, host } = setup();
    filter.catch('plain string', host);
    expect(logger.critical.mock.calls[0][1]).toMatchObject({ status_code: 500 });
  });

  it('AC-23: the fallback branch (the filter failing itself) logs critical with status_code 500', () => {
    const { filter, create, logger, response, host } = setup();
    response.status.mockImplementationOnce(() => {
      throw new Error('response broke');
    });
    filter.catch(new BadRequestException('x'), host);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1][0]).toBe('api.error');
    const fallback = logger.critical.mock.calls.at(-1);
    expect(fallback[0]).toBe('response broke');
    expect(fallback[1]).toMatchObject({ status_code: 500 });
  });

  it('AC-23: the client body for an unexpected 500 stays generic', () => {
    const { filter, json, host } = setup();
    filter.catch(new Error('SQL detail'), host);
    expect(json.mock.calls[0][0].error.message).toBe('Internal Server Error');
  });

  it('AC-23: never flushes after logging (the worker writes the lines)', () => {
    const { filter, host } = setup();
    const flush = jest.spyOn(logBuffer, 'flush');
    filter.catch(new HttpException('x', 503), host);
    expect(flush).not.toHaveBeenCalled();
  });
});
