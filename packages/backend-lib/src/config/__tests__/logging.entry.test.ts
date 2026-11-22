jest.mock('../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import os from 'node:os';
import type { ApiLogContext } from '@repo/common-lib/types/log';
import { LogService } from '../../services/log-service/log.service';
import { InMemoryLogBuffer } from '../../services/log-service/buffers/in-memory-log.buffer';
import { ConsoleLogDriver } from '../../services/log-service/drivers/console-log.driver';
import type { LogConfig, LogContext, LogLevel } from '../../services/log-service/types';
import { criticalAlertMail } from '../../utils/critical-alert-mail';
import { buildLogEntry, emailCritical, type LogEntry } from '../logging';

// The project shape of a written line: what `buildLogEntry` (the project layer) adds on top of the
// generic LogService. The generic behaviour is in services/log-service/__tests__/log.service.test.ts.

const request = (over: Partial<ApiLogContext> = {}): ApiLogContext => ({
  id: 'req-1',
  method: 'GET',
  path: '/v1/media/1',
  ip_address: '1.2.3.4',
  user_agent: 'jest',
  user_id: 7,
  user_role: 'USER',
  language: 'EN' as ApiLogContext['language'],
  unattributed_app_call: false,
  ...over,
});

const ANSI = new RegExp(String.fromCharCode(27) + '\\[\\d+m', 'g');

const logContext = (over: Partial<LogContext> = {}): LogContext => ({
  timestamp: new Date('2026-11-14T12:00:00.000Z'),
  level: 'info',
  service: 'api',
  message: 'hello',
  format: 'json',
  id: 'i',
  ...over,
});

/** A logger over the project's entry builder, printing through the console driver on flush. */
const consoleLogger = (config: LogConfig<ApiLogContext>) => {
  const buffer = new InMemoryLogBuffer(new ConsoleLogDriver<LogEntry>());
  return { logger: new LogService<ApiLogContext, LogEntry>({ service: 'api', ...config }, buffer, buildLogEntry), buffer };
};

/** Logs through `call`, flushes, and returns what the console printed on `method`. */
const printed = async (
  config: LogConfig<ApiLogContext>,
  call: (logger: LogService<ApiLogContext, LogEntry>) => void = (logger) => void logger.info('hello', { a: 1 }),
  method: 'log' | 'error' = 'log',
): Promise<string> => {
  const spy = jest.spyOn(console, method).mockImplementation(() => undefined);
  const { logger, buffer } = consoleLogger(config);
  call(logger);
  await buffer.flush();
  await buffer.settle();
  const line = spy.mock.calls[0][0] as string;
  spy.mockRestore();
  return line;
};

afterEach(() => jest.restoreAllMocks());

describe('buildLogEntry: the line shape', () => {
  it('writes the level uppercase, the service, replica and the timestamp as an ISO string', () => {
    const entry = buildLogEntry(logContext({ level: 'warn' }));
    expect(entry).toMatchObject({
      level: 'WARN',
      service: 'api',
      message: 'hello',
      id: 'i',
      replica: os.hostname().slice(0, 64),
      timestamp: '2026-11-14T12:00:00.000Z',
    });
  });

  it.each<[LogLevel, string]>([
    ['info', 'INFO'],
    ['error', 'ERROR'],
    ['warn', 'WARN'],
    ['debug', 'DEBUG'],
    ['success', 'SUCCESS'],
    ['critical', 'CRITICAL'],
  ])('level %s is written as %s', (level, label) => {
    expect(buildLogEntry(logContext({ level })).level).toBe(label);
  });

  it('lifts channel, operation and status_code out of the options; the rest is extraInfo', () => {
    const entry = buildLogEntry(logContext({ logOptions: { channel: 'users', operation: 'new-user', status_code: 404, user_id: 7 } }));
    expect(entry).toMatchObject({ channel: 'users', operation: 'new-user', status_code: 404, extraInfo: { user_id: 7 } });
    expect(entry.extraInfo).not.toHaveProperty('channel');
    expect(entry.extraInfo).not.toHaveProperty('operation');
    expect(entry.extraInfo).not.toHaveProperty('status_code');
  });

  it('defaults the channel to system and the operation to null; an unknown channel becomes system', () => {
    expect(buildLogEntry(logContext())).toMatchObject({ channel: 'system', operation: null });
    expect(buildLogEntry(logContext({ logOptions: { channel: 'not-a-channel' } })).channel).toBe('system');
    expect(buildLogEntry(logContext({ logOptions: { channel: 'api/errors/500' } })).channel).toBe('system');
    expect(buildLogEntry(logContext({ logOptions: { channel: 'api.error' } })).channel).toBe('api.error');
  });

  it('a string method is the top-level field (an Alloy label); any other type stays in extraInfo', () => {
    const text = buildLogEntry(logContext({ logOptions: { method: 'google', other: 1 } }));
    expect(text.method).toBe('google');
    expect(text.extraInfo).toEqual({ other: 1 });
    const numeric = buildLogEntry(logContext({ logOptions: { method: 200 } }));
    expect('method' in numeric).toBe(false);
    expect(numeric.extraInfo).toEqual({ method: 200 });
  });

  it('status_code is top-level only when numeric, and never in extraInfo', () => {
    expect(buildLogEntry(logContext({ logOptions: { status_code: 500 } }))).toMatchObject({ status_code: 500 });
    const entry = buildLogEntry(logContext({ logOptions: { status_code: '500' } }));
    expect('status_code' in entry).toBe(false);
  });

  it('id is "" when there is no trace', () => {
    expect(buildLogEntry(logContext({ id: null })).id).toBe('');
  });

  it('request is the redacted globalContext, and is absent without one', () => {
    const dirty = { ...request(), bearer_token: 'secret-bearer' } as unknown as ApiLogContext;
    const withRequest = buildLogEntry(logContext(), dirty);
    expect(withRequest.request).toMatchObject({ id: 'req-1', path: '/v1/media/1' });
    expect(JSON.stringify(withRequest)).not.toContain('secret-bearer');
    expect('request' in buildLogEntry(logContext())).toBe(false);
  });

  it('extraInfo is redacted and absent when there is nothing to say', () => {
    const entry = buildLogEntry(logContext({ logOptions: { password: 'hunter2', user_id: 7, nested: { apiKey: 'z' } } }));
    expect(entry.extraInfo).toMatchObject({ password: '[REDACTED]', user_id: 7, nested: { apiKey: '[REDACTED]' } });
    expect('extraInfo' in buildLogEntry(logContext())).toBe(false);
    expect('extraInfo' in buildLogEntry(logContext({ logOptions: { channel: 'media', operation: 'x', status_code: 200 } }))).toBe(false);
  });

  it('an Error as options is extraInfo { name, message, stack }, with no secrets leaking through the message', () => {
    const failure = new RangeError('too far');
    const entry = buildLogEntry(logContext({ level: 'error', logOptions: failure }));
    expect(entry.extraInfo).toEqual({ name: 'RangeError', message: 'too far', stack: failure.stack });
    expect(entry.channel).toBe('system');
  });

  it('an Error merged under defaultOptions keeps the channel and operation as line fields', async () => {
    const buffer = new InMemoryLogBuffer(new ConsoleLogDriver<LogEntry>());
    const added: LogEntry[] = [];
    jest.spyOn(buffer, 'add').mockImplementation((_context, entry) => void added.push(entry));
    const logger = new LogService<ApiLogContext, LogEntry>(
      { service: 'worker', defaultOptions: { channel: 'ai', operation: 'llm-call' } },
      buffer,
      buildLogEntry,
    );
    const failure = new Error('rate limited');
    logger.error('failed', failure);
    expect(added[0]).toMatchObject({ channel: 'ai', operation: 'llm-call', extraInfo: { name: 'Error', message: 'rate limited', stack: failure.stack } });
  });

  it('writes the fields in the documented key order, extraInfo last', () => {
    const entry = buildLogEntry(
      logContext({ logOptions: { channel: 'users', operation: 'new-user', status_code: 201, method: 'password', a: 1 } }),
      request(),
    );
    const keys = Object.keys(entry).filter((key) => key !== 'format');
    expect(keys).toEqual(['timestamp', 'level', 'service', 'channel', 'operation', 'id', 'message', 'replica', 'method', 'status_code', 'request', 'extraInfo']);
  });
});

describe('the line through the console driver', () => {
  it('json: one line, uppercase level, no colour codes, the format key is not written', async () => {
    const line = await printed({ id: 'i', defaultOptions: { channel: 'users', operation: 'new-user' }, globalContext: () => request() });
    expect(line).not.toMatch(ANSI);
    const parsed = JSON.parse(line);
    expect(parsed).toMatchObject({ service: 'api', replica: os.hostname().slice(0, 64), channel: 'users', operation: 'new-user', level: 'INFO', id: 'i', message: 'hello', extraInfo: { a: 1 } });
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(parsed.request.id).toBe('req-1');
    expect(parsed).not.toHaveProperty('format');
  });

  it('defaults channel to system and id to ""; a logger with no globalContext writes no request', async () => {
    const parsed = JSON.parse(await printed({}));
    expect(parsed.channel).toBe('system');
    expect(parsed.id).toBe('');
    expect('request' in parsed).toBe(false);
  });

  it('resolves id and globalContext functions on every line', async () => {
    const parsed = JSON.parse(await printed({ id: () => 'fn-id', globalContext: () => request({ id: 'R' }) }));
    expect(parsed.id).toBe('fn-id');
    expect(parsed.request.id).toBe('R');
  });

  it('a per-call operation wins over the default; status_code is written top-level', async () => {
    const parsed = JSON.parse(
      await printed(
        { defaultOptions: { operation: 'cfg' } },
        (logger) => void logger.error('m', { operation: 'call', status_code: 500 }),
        'error',
      ),
    );
    expect(parsed.operation).toBe('call');
    expect(parsed.status_code).toBe(500);
    expect('extraInfo' in parsed).toBe(false);
  });

  it('redacts secrets in request and extraInfo', async () => {
    const dirty = { ...request(), bearer_token: 'secret-bearer' } as unknown as ApiLogContext;
    const line = await printed({ globalContext: () => dirty }, (logger) => void logger.info('m', { password: 'hunter2' }));
    expect(line).not.toContain('secret-bearer');
    expect(line).not.toContain('hunter2');
  });

  it('logfmt writes key=value pairs, flattens nested objects and is coloured; json is not', async () => {
    const line = await printed({ format: 'logfmt', id: 'req-1', defaultOptions: { channel: 'api' }, globalContext: () => request() });
    expect(line).toMatch(ANSI);
    const plain = line.replace(ANSI, '');
    expect(plain).toMatch(/^timestamp=\S+ level=INFO /);
    expect(plain).toContain(' channel=api ');
    expect(plain).toContain(' id=req-1 ');
    expect(plain).toContain(' message=hello ');
    expect(plain).toContain(' request.method=GET');
    expect(plain).toMatch(/ extraInfo\.a=1$/);
    expect(plain).not.toContain('format=');
    expect(await printed({ defaultOptions: { channel: 'api' } })).not.toMatch(ANSI);
  });
});

describe('emailCritical', () => {
  beforeEach(() => (criticalAlertMail as jest.Mock).mockClear());

  it('mails critical lines only', async () => {
    const { logger, buffer } = consoleLogger({ callback: emailCritical });
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.info('fine');
    logger.error('handled');
    logger.warn('careful');
    logger.critical('wake up');
    await buffer.settle();
    expect(criticalAlertMail).toHaveBeenCalledTimes(1);
    expect((criticalAlertMail as jest.Mock).mock.calls[0][0]).toMatchObject({ level: 'CRITICAL', message: 'wake up' });
  });

  it('hands the mail the line as it is written (AC-9): same channel, no channel/operation/status_code in extraInfo', async () => {
    const globalContext = request({ id: 'r-9' });
    const context = logContext({ level: 'critical', message: 'db down', logOptions: { channel: 'not-a-channel', operation: 'op', status_code: 503, detail: 'x' } });
    await emailCritical(context, globalContext);
    expect(criticalAlertMail).toHaveBeenCalledTimes(1);
    const mailed = (criticalAlertMail as jest.Mock).mock.calls[0][0];
    expect(mailed).toEqual(buildLogEntry(context, globalContext));
    expect(mailed.channel).toBe('system');
    expect(mailed.extraInfo).toEqual({ detail: 'x' });
    expect(mailed.status_code).toBe(503);
  });

  it('never mails a line that is not critical, whatever its status', async () => {
    for (const level of ['info', 'error', 'warn', 'debug', 'success'] as const) {
      await emailCritical(logContext({ level, logOptions: { status_code: 500 } }));
    }
    expect(criticalAlertMail).not.toHaveBeenCalled();
  });
});
