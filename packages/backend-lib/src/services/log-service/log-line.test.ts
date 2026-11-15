import os from 'node:os';
import { LogService } from './log.service';
import { ConsoleLogService } from './console-log.service';
import { configureLogProcess } from './process-context';
import { LogConfig, LogEntry } from './types';
import { RequestLogContext } from '@repo/common-lib/types/request';

class TestLog extends LogService {}

const request: RequestLogContext = {
  id: 'r1',
  method: 'POST',
  path: '/api/v1/x',
  ip_address: '1.1.1.1',
  user_agent: 'jest',
  user_id: 3,
  user_role: 'USER',
  language: null,
  unattributed_app_call: false,
};

const ANSI = new RegExp(String.fromCharCode(27) + '\\[\\d+m', 'g');

const spies = () => ({
  log: jest.spyOn(console, 'log').mockImplementation(() => undefined),
  error: jest.spyOn(console, 'error').mockImplementation(() => undefined),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => undefined),
  debug: jest.spyOn(console, 'debug').mockImplementation(() => undefined),
});

describe('log line shape', () => {
  beforeEach(() => {
    jest.spyOn(os, 'hostname').mockReturnValue('host-1');
    configureLogProcess({ service: 'api' });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    configureLogProcess({ service: '', onCritical: null });
  });

  it('AC-1: full key order with every optional present', () => {
    const s = spies();
    new TestLog({ channel: 'media', name: 'create', id: 'r1', request: () => request }).info(
      'm',
      { a: 1 },
      { status_code: 201 },
    );
    const parsed = JSON.parse(s.log.mock.calls[0][0] as string);
    expect(Object.keys(parsed)).toEqual([
      'timestamp', 'service', 'replica', 'channel', 'operation', 'level', 'id', 'message', 'status_code', 'status', 'request', 'extraInfo',
    ]);
    expect(parsed).toMatchObject({ service: 'api', replica: 'host-1', channel: 'media', operation: 'create', level: 'INFO', id: 'r1', status_code: 201 });
  });

  it('AC-1: operation is always present (null) while status_code, request and extraInfo are omitted', () => {
    const s = spies();
    new TestLog({ channel: 'media' }).info('m');
    const parsed = JSON.parse(s.log.mock.calls[0][0] as string);
    expect(Object.keys(parsed)).toEqual(['timestamp', 'service', 'replica', 'channel', 'operation', 'level', 'id', 'message']);
    expect(parsed.operation).toBeNull();
    expect(parsed.id).toBeNull();
    expect('status_code' in parsed).toBe(false);
    expect('request' in parsed).toBe(false);
    expect('extraInfo' in parsed).toBe(false);
  });

  it('AC-3: operation is config.name / .name(), read live by the sync driver', () => {
    const s = spies();
    const logger = new TestLog({ channel: 'ai', name: 'first' });
    logger.info('1');
    logger.name('second').info('2');
    const lines = s.log.mock.calls.map((c) => JSON.parse(c[0] as string));
    expect(lines.map((l) => l.operation)).toEqual(['first', 'second']);
  });

  it('AC-4: fields.status_code becomes top-level for every level method', () => {
    const s = spies();
    const logger = new TestLog({ channel: 'api.error' });
    logger.info('a', undefined, { status_code: 200 });
    logger.warn('b', undefined, { status_code: 404 });
    logger.error('c', undefined, { status_code: 500 });
    logger.debug('d', undefined, { status_code: 1 });
    logger.success('e', undefined, { status_code: 2 });
    logger.critical('f', undefined, { status_code: 503 });
    const all = [...s.log.mock.calls, ...s.warn.mock.calls, ...s.error.mock.calls, ...s.debug.mock.calls].map((c) =>
      JSON.parse(c[0] as string),
    );
    expect(all).toHaveLength(6);
    expect(all.map((l) => l.status_code).sort((a, b) => a - b)).toEqual([1, 2, 200, 404, 500, 503]);
  });

  it('AC-4: no other top-level key can be injected through fields', () => {
    const s = spies();
    new TestLog({ channel: 'api' }).info('m', undefined, { status_code: 200, level: 'HACK', service: 'evil', channel: 'x' } as any);
    const parsed = JSON.parse(s.log.mock.calls[0][0] as string);
    expect(parsed.level).toBe('INFO');
    expect(parsed.service).toBe('api');
    expect(parsed.channel).toBe('api');
    expect(Object.keys(parsed)).not.toContain('x');
  });

  it.each([
    [100, '1xx'], [200, '2xx'], [301, '3xx'], [404, '4xx'], [429, '4xx'], [503, '5xx'], [599, '5xx'],
  ])('AC-38: status_code %i also writes status %s right after it', (code, cls) => {
    const s = spies();
    new TestLog({ channel: 'api.error' }).warn('m', undefined, { status_code: code });
    const parsed = JSON.parse((s.warn.mock.calls[0][0]) as string);
    expect(parsed.status).toBe(cls);
    const keys = Object.keys(parsed);
    expect(keys[keys.indexOf('status_code') + 1]).toBe('status');
  });

  it('AC-38: no status_code means no status', () => {
    const s = spies();
    new TestLog({ channel: 'api' }).info('m');
    expect('status' in JSON.parse(s.log.mock.calls[0][0] as string)).toBe(false);
  });

  it.each([42, 99, 600, 1000, -200, 200.5, Number.NaN])('AC-38: invalid status_code %p gives no status', (code) => {
    const s = spies();
    new TestLog({ channel: 'api' }).info('m', undefined, { status_code: code });
    expect('status' in JSON.parse(s.log.mock.calls[0][0] as string)).toBe(false);
  });

  it('AC-38: status cannot be injected through fields', () => {
    const s = spies();
    new TestLog({ channel: 'api' }).info('m', undefined, { status: '9xx' } as any);
    expect('status' in JSON.parse(s.log.mock.calls[0][0] as string)).toBe(false);
  });

  it('AC-4: a non-numeric status_code is ignored', () => {
    const s = spies();
    new TestLog({ channel: 'api' }).info('m', undefined, { status_code: '500' } as any);
    expect('status_code' in JSON.parse(s.log.mock.calls[0][0] as string)).toBe(false);
  });

  it('AC-5: string format has [operation] after the channel, then the id and METHOD', () => {
    const s = spies();
    new TestLog({ channel: 'media', format: 'string', name: 'create', id: 'r1', request: () => request }).info('hi', { a: 1 });
    expect(s.log.mock.calls[0][0]).toMatch(
      /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]\[media\]\[create\] - INFO -\[r1\]\[POST\] hi - \{"a":1\}\n$/,
    );
  });

  it('AC-5: no operation bracket without a name', () => {
    const s = spies();
    new TestLog({ channel: 'media', format: 'string', id: 'r1' }).info('hi');
    expect(s.log.mock.calls[0][0]).toMatch(/\]\[media\] - INFO -\[r1\] hi\n$/);
  });

  it('AC-15: critical prints CRITICAL JSON through console.error', () => {
    const s = spies();
    new TestLog({ channel: 'api.error' }).critical('boom');
    expect(s.error).toHaveBeenCalledTimes(1);
    expect(JSON.parse(s.error.mock.calls[0][0] as string).level).toBe('CRITICAL');
  });

  it('AC-15: the console driver colours critical (bgRed) in string format only', () => {
    const s = spies();
    const colours = require('picocolors').createColors(true);
    const painted = colours.bgRed(colours.white('x'));
    new ConsoleLogService({ channel: 'api', format: 'string' }).critical('boom');
    const line = s.error.mock.calls[0][0] as string;
    expect(line.replace(ANSI, '')).toContain('CRITICAL');
    expect(typeof painted).toBe('string');
    new ConsoleLogService({ channel: 'api' }).critical('boom');
    const json = s.error.mock.calls[1][0] as string;
    expect(json).not.toMatch(ANSI);
    expect(JSON.parse(json).level).toBe('CRITICAL');
  });

  it('AC-15: FileLogService and ConsoleLogService both have critical()', () => {
    expect(typeof ConsoleLogService.prototype.critical).toBe('function');
    expect(typeof require('./file-log.service').FileLogService.prototype.critical).toBe('function');
  });
});

describe('critical dispatch', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    configureLogProcess({ service: '', onCritical: null });
  });

  it('AC-17: the handler gets the serialised entry once, with redacted extraInfo and request', async () => {
    const s = spies();
    const handler = jest.fn().mockResolvedValue(undefined);
    configureLogProcess({ service: 'worker', onCritical: handler });
    const dirty = { ...request, bearer_token: 'SECRETB' } as unknown as RequestLogContext;
    new TestLog({ channel: 'mail', name: 'send-mail', id: 'j1', request: () => dirty }).critical(
      'failed',
      { password: 'SECRETPW', ok: 1 },
      { status_code: 500 },
    );
    await new Promise((r) => setImmediate(r));
    expect(handler).toHaveBeenCalledTimes(1);
    const entry = handler.mock.calls[0][0] as LogEntry;
    expect(entry).toMatchObject({
      service: 'worker', channel: 'mail', operation: 'send-mail', id: 'j1', status_code: 500, message: 'failed', level: 'CRITICAL',
    });
    expect(entry.timestamp).toMatch(/Z$/);
    expect(entry.replica).toEqual(expect.any(String));
    expect(JSON.stringify(entry)).not.toMatch(/SECRETB|SECRETPW/);
    // Same object content that was printed.
    expect(JSON.parse(s.error.mock.calls[0][0] as string)).toEqual(JSON.parse(JSON.stringify(entry)));
  });

  it('AC-17: no other level ever calls the handler', async () => {
    spies();
    const handler = jest.fn().mockResolvedValue(undefined);
    configureLogProcess({ service: 'api', onCritical: handler });
    const logger = new TestLog({ channel: 'api' });
    logger.info('a').warn('b').error('c').debug('d').success('e');
    await new Promise((r) => setImmediate(r));
    expect(handler).not.toHaveBeenCalled();
  });

  it('AC-17: with no handler, critical() writes the line and does not throw', () => {
    const s = spies();
    configureLogProcess({ service: 'dbcli' });
    expect(() => new TestLog({ channel: 'backup' }).critical('x')).not.toThrow();
    expect(s.error).toHaveBeenCalledTimes(1);
  });

  it('AC-17: ConsoleLogService dispatches critical as well', async () => {
    spies();
    const handler = jest.fn().mockResolvedValue(undefined);
    configureLogProcess({ service: 'api', onCritical: handler });
    new ConsoleLogService({ channel: 'api' }).critical('x');
    await new Promise((r) => setImmediate(r));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('AC-18: a throwing handler is reported with console.error only and never throws', async () => {
    const s = spies();
    configureLogProcess({ service: 'api', onCritical: () => { throw new Error('sync boom'); } });
    expect(() => new TestLog({ channel: 'api' }).critical('x')).not.toThrow();
    await new Promise((r) => setImmediate(r));
    expect(s.error.mock.calls.some((c) => String(c[0]).includes('critical handler failed'))).toBe(true);
  });

  it('AC-18: a rejecting handler is swallowed and does not loop through LogService', async () => {
    const s = spies();
    const handler = jest.fn().mockRejectedValue(new Error('async boom'));
    configureLogProcess({ service: 'api', onCritical: handler });
    new TestLog({ channel: 'api' }).critical('x');
    await new Promise((r) => setImmediate(r));
    expect(handler).toHaveBeenCalledTimes(1);
    // The report is a plain console.error, not a JSON log line.
    const reports = s.error.mock.calls.filter((c) => String(c[0]).includes('critical handler failed'));
    expect(reports).toHaveLength(1);
    expect(() => JSON.parse(String(reports[0][0]))).toThrow();
  });
});

export type { LogConfig };
