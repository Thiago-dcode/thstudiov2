import { BadRequestException, HttpException } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { ConsoleLogService } from '@repo/backend-lib/services/log-service';
import { ResponseExceptionFilter } from './response-exception.filter';
import { RequestService } from '../services/request.service';

const ADDRESSES = ['login@example.com', 'nested@example.com', 'array@example.com', 'inline@example.com', 'query@example.com', 'param@example.com'];

const setup = (request: Record<string, unknown>) => {
  const out: string[] = [];
  for (const method of ['log', 'warn', 'error'] as const) {
    jest.spyOn(console, method).mockImplementation((line: unknown) => { out.push(String(line)); });
  }
  jest.spyOn(FactoryLogService, 'createLogService').mockImplementation((_t, cfg) => new ConsoleLogService(cfg));
  jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  const requestService = { logBinding: () => ({ id: () => 'rid', request: () => null }) } as unknown as RequestService;
  const filter = new ResponseExceptionFilter(requestService);
  const json = jest.fn();
  const response: any = { status: jest.fn().mockReturnValue({ json }) };
  const host: any = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }) };
  return { filter, host, out, json };
};

const baseRequest = (over: Record<string, unknown> = {}) => ({
  path: '/api/v1/auth/login',
  headers: {},
  body: {
    email: ADDRESSES[0],
    Email_Address: ADDRESSES[0],
    profile: { contactEmail: ADDRESSES[1], tags: [ADDRESSES[2]] },
    note: `please contact ${ADDRESSES[3]} soon`,
    password: 'PLAINPW',
    code: '123456',
    keep: 'visible',
  },
  params: {},
  query: { e_mail: ADDRESSES[4], page: '2', free: ADDRESSES[4] },
  ...over,
});

describe('ResponseExceptionFilter email handling', () => {
  afterEach(() => jest.restoreAllMocks());

  it('drops email keys and redacts address-shaped values at any depth in the logged body/query/params', () => {
    const { filter, host, out } = setup(baseRequest({ params: { who: ADDRESSES[5] } }));
    filter.catch(new BadRequestException('invalid credentials'), host);
    const logged = out.join('\n');
    for (const address of ADDRESSES) expect(logged).not.toContain(address);
    const line = JSON.parse(out[0]);
    expect(line.extraInfo.requestBody).not.toHaveProperty('email');
    expect(line.extraInfo.requestBody).not.toHaveProperty('Email_Address');
    expect(line.extraInfo.requestBody.profile).not.toHaveProperty('contactEmail');
    expect(line.extraInfo.requestQuery).not.toHaveProperty('e_mail');
  });

  it('keeps the non-email fields, redacts the one-time code and the password', () => {
    const { filter, host, out } = setup(baseRequest());
    filter.catch(new BadRequestException('x'), host);
    const line = JSON.parse(out[0]);
    expect(line.extraInfo.requestBody.keep).toBe('visible');
    expect(line.extraInfo.requestBody.code).toBe('[REDACTED]');
    expect(line.extraInfo.requestBody.password).toBe('[REDACTED]');
    expect(line.extraInfo.requestQuery.page).toBe('2');
    expect(out.join('\n')).not.toContain('PLAINPW');
    expect(out.join('\n')).not.toContain('123456');
  });

  it('keeps request values that merely contain an @ (asset names, pnpm paths) and still redacts real addresses', () => {
    const { filter, host, out } = setup(
      baseRequest({
        body: {
          file: 'photo@2x.png',
          trace: 'at /app/node_modules/.pnpm/stripe@17.7.0/node_modules/stripe/x.js:1:1',
          scoped: '@aws-sdk/client-s3',
          note: 'mail me at ross@example.com',
          keep: 'visible',
        },
        query: { q: 'bullmq@6.7.1_ioredis@5.4.1' },
      }),
    );
    filter.catch(new BadRequestException('x'), host);
    const line = JSON.parse(out[0]);
    expect(line.extraInfo.requestBody.file).toBe('photo@2x.png');
    expect(line.extraInfo.requestBody.trace).toBe('at /app/node_modules/.pnpm/stripe@17.7.0/node_modules/stripe/x.js:1:1');
    expect(line.extraInfo.requestBody.scoped).toBe('@aws-sdk/client-s3');
    expect(line.extraInfo.requestBody.note).toBe('[REDACTED]');
    expect(line.extraInfo.requestQuery.q).toBe('bullmq@6.7.1_ioredis@5.4.1');
    expect(out.join('\n')).not.toContain('ross@example.com');
  });

  it('does not change the client response body (the caller keeps what it sent)', () => {
    const { filter, host, json } = setup(baseRequest());
    filter.catch(new BadRequestException('x'), host);
    expect(json.mock.calls[0][0].error.status_code).toBe(400);
  });

  it('also holds for a 5xx critical line', () => {
    const { filter, host, out } = setup(baseRequest());
    filter.catch(new HttpException('boom', 503), host);
    const logged = out.join('\n');
    expect(JSON.parse(out[0]).level).toBe('CRITICAL');
    for (const address of ADDRESSES) expect(logged).not.toContain(address);
  });

  it.each([
    [404, '4xx'],
    [503, '5xx'],
  ])('AC-38: a %i error line carries status_code and status %s right after it', (code, cls) => {
    const { filter, host, out } = setup(baseRequest());
    filter.catch(new HttpException('x', code), host);
    const line = JSON.parse(out[0]);
    expect(line.status_code).toBe(code);
    expect(line.status).toBe(cls);
    const keys = Object.keys(line);
    expect(keys[keys.indexOf('status_code') + 1]).toBe('status');
  });

  it('a primitive or missing body does not break the filter', () => {
    const { filter, host, json } = setup(baseRequest({ body: undefined, query: undefined, params: undefined }));
    expect(() => filter.catch(new BadRequestException('x'), host)).not.toThrow();
    expect(json).toHaveBeenCalled();
  });

  it('a cyclic body does not break the filter', () => {
    const body: Record<string, unknown> = { keep: 1 };
    body.self = body;
    const { filter, host, json } = setup(baseRequest({ body }));
    expect(() => filter.catch(new BadRequestException('x'), host)).not.toThrow();
    expect(json).toHaveBeenCalled();
  });

  // The exception message is Nest's/our own text; a service can quote an address in it.
  it('an address quoted in the exception message does not reach the log line', () => {
    const { filter, host, out } = setup(baseRequest());
    filter.catch(new BadRequestException(`No account for ${ADDRESSES[0]}`), host);
    expect(out.join('\n')).not.toContain(ADDRESSES[0]);
  });
});
