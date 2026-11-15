import { LogService } from './log.service';
import { ConsoleLogService } from './console-log.service';
import { LogConfig } from './types';
import { RequestLogContext } from '@repo/common-lib/types/request';

const ctx = (over: Partial<RequestLogContext> = {}): RequestLogContext => ({
  id: 'req-1',
  method: 'GET',
  path: '/v1/media/1',
  ip_address: '1.2.3.4',
  user_agent: 'jest',
  user_id: 7,
  user_role: 'USER',
  language: 'EN' as RequestLogContext['language'],
  unattributed_app_call: false,
  ...over,
});

/** The base class writes synchronously with console.log and no colouring. */
class TestLog extends LogService {}

const capture = (config: LogConfig, cls: new (c: LogConfig) => LogService = TestLog) => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const logger = new cls(config);
  logger.info('hello', { a: 1 });
  const line = spy.mock.calls[0][0] as string;
  spy.mockRestore();
  return line;
};

const ANSI = new RegExp(String.fromCharCode(27) + '\\[\\d+m', 'g');

describe('LogService request context', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-5: exposes a request() builder that resolves a function value', () => {
    const logger = new TestLog({ channel: 'system', id: 'x' });
    expect(logger.request(() => ctx())).toBe(logger);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    logger.info('m');
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.request.id).toBe('req-1');
  });

  it('AC-6: json with request has the key order and ISO timestamp', () => {
    const c = ctx();
    const line = capture({ channel: 'api', id: 'req-1', request: () => c });
    expect(line.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(line);
    expect(Object.keys(parsed)).toEqual(['timestamp', 'service', 'replica', 'channel', 'operation', 'level', 'id', 'message', 'request', 'extraInfo']);
    expect(parsed.request).toEqual(c);
    expect(Object.keys(parsed.request)).toEqual(Object.keys(c));
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(parsed.level).toBe('INFO');
    expect(parsed.extraInfo).toEqual({ a: 1 });
  });

  it('AC-6: a plain object value (not a function) is also accepted', () => {
    const parsed = JSON.parse(capture({ channel: 'api', request: ctx() }));
    expect(parsed.request.path).toBe('/v1/media/1');
  });

  it('AC-7: no request key when unset', () => {
    const parsed = JSON.parse(capture({ channel: 'backup' }));
    expect('request' in parsed).toBe(false);
  });

  it('AC-7: no request key when the function returns null', () => {
    const parsed = JSON.parse(capture({ channel: 'api', request: () => null }));
    expect('request' in parsed).toBe(false);
  });

  it('AC-7: no request key when value is null', () => {
    const parsed = JSON.parse(capture({ channel: 'api', request: null }));
    expect('request' in parsed).toBe(false);
  });

  it('AC-8: string format puts [METHOD] right after the id', () => {
    const line = capture({ channel: 'api', format: 'string', id: 'req-1', request: () => ctx() });
    expect(line).toMatch(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]\[api\] - INFO -\[req-1\]\[GET\] hello - \{"a":1\}\n$/);
    expect(line).not.toContain('/v1/media/1');
    expect(line).not.toContain('1.2.3.4');
  });

  it('AC-8: string format with id and no method', () => {
    const line = capture({ channel: 'api', format: 'string', id: 'req-1', request: () => ctx({ method: null }) });
    expect(line).toContain(' - INFO -[req-1] hello');
    expect(line).not.toContain('[GET]');
  });

  it('AC-8: string format with neither id nor request is unchanged', () => {
    const line = capture({ channel: 'api', format: 'string' });
    expect(line).toContain(' - INFO - hello');
  });

  it('AC-6: string timestamp keeps yyyy-MM-dd HH:mm:ss (not ISO)', () => {
    const line = capture({ channel: 'api', format: 'string' });
    expect(line).not.toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  it('AC-9: extra secret keys on the context are redacted in json', () => {
    const dirty = {
      ...ctx(),
      bearer_token: 'secret-bearer',
      authorization: 'Bearer abc',
      token: 'tok',
    } as unknown as RequestLogContext;
    const line = capture({ channel: 'api', request: () => dirty });
    expect(line).not.toContain('secret-bearer');
    expect(line).not.toContain('Bearer abc');
    const parsed = JSON.parse(line);
    expect(parsed.request.bearer_token).toBe('[REDACTED]');
    expect(parsed.request.authorization).toBe('[REDACTED]');
    expect(parsed.request.token).toBe('[REDACTED]');
  });

  it('AC-9: extraInfo redaction is unchanged', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    new TestLog({ channel: 'system' }).info('m', { password: 'hunter2' });
    expect(spy.mock.calls[0][0]).not.toContain('hunter2');
  });

  it('AC-11: base LogService reads the context live on every call', () => {
    let current: RequestLogContext | null = ctx({ id: 'A' });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = new TestLog({ channel: 'system', request: () => current });
    logger.info('1');
    current = ctx({ id: 'B' });
    logger.info('2');
    current = null;
    logger.info('3');
    const lines = spy.mock.calls.map((c) => JSON.parse(c[0] as string));
    expect(lines[0].request.id).toBe('A');
    expect(lines[1].request.id).toBe('B');
    expect('request' in lines[2]).toBe(false);
  });

  it('AC-11: ConsoleLogService reads live and keeps json uncoloured', () => {
    const line = capture({ channel: 'system', request: () => ctx() }, ConsoleLogService);
    expect(line).not.toMatch(ANSI);
    expect(JSON.parse(line).request.id).toBe('req-1');
  });

  it('AC-11: ConsoleLogService string format includes the METHOD bracket', () => {
    const line = capture({ channel: 'system', format: 'string', id: 'i', request: () => ctx() }, ConsoleLogService);
    expect(line.replace(ANSI, '')).toContain('-[i][GET] hello');
  });
});
