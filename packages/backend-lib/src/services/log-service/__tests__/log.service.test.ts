jest.mock('../../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import type Redis from 'ioredis';
import os from 'node:os';
import { LogService } from '../log.service';
import { InMemoryLogBuffer } from '../buffers/in-memory-log.buffer';
import { RedisLogBuffer } from '../buffers/redis-log.buffer';
import { ConsoleLogDriver } from '../drivers/console-log.driver';
import { LogDriver } from '../drivers/log.driver';
import { LogConfig, LogEntry } from '../types';
import { RequestLogContext } from '@repo/common-lib/types/request';
import { emailCritical, logBuffer } from '../../../config/logging';
import { criticalAlertMail } from '../../../utils/critical-alert-mail';

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

const ANSI = new RegExp(String.fromCharCode(27) + '\\[\\d+m', 'g');

/** A logger printing through the console driver on flush. */
const consoleLogger = (config: LogConfig) => {
  const buffer = new InMemoryLogBuffer(new ConsoleLogDriver());
  return { logger: new LogService(config, buffer), buffer };
};

/** Logs one info line, flushes, and returns the printed text. */
const capture = async (config: LogConfig): Promise<string> => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const { logger, buffer } = consoleLogger(config);
  logger.info('hello', { a: 1 });
  await buffer.flush();
  await buffer.settle();
  const line = spy.mock.calls[0][0] as string;
  spy.mockRestore();
  return line;
};

/** Records every entry it is given. */
class MemoryDriver extends LogDriver {
  written: LogEntry[] = [];
  async process(entry: LogEntry): Promise<void> {
    this.written.push(entry);
  }
}

afterEach(() => jest.restoreAllMocks());

describe('LogService config', () => {
  it('writes service, replica, channel and operation from config, in key order; format is not written', async () => {
    const parsed = JSON.parse(await capture({ service: 'api', channel: 'users', name: 'new-user', id: 'i', request: ctx() }));
    expect(Object.keys(parsed)).toEqual(['timestamp', 'level', 'id', 'service', 'message', 'method', 'replica', 'channel', 'operation', 'request', 'extraInfo']);
    expect(parsed).toMatchObject({ service: 'api', replica: os.hostname().slice(0, 64), channel: 'users', operation: 'new-user', level: 'INFO', id: 'i' });
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('defaults service to unknown and channel to system', async () => {
    const parsed = JSON.parse(await capture({}));
    expect(parsed.service).toBe('unknown');
    expect(parsed.channel).toBe('system');
    expect(parsed.id).toBeNull();
    expect('request' in parsed).toBe(false);
  });

  it('resolves id and request functions', async () => {
    const parsed = JSON.parse(await capture({ id: () => 'fn-id', request: () => ctx({ id: 'R' }) }));
    expect(parsed.id).toBe('fn-id');
    expect(parsed.request.id).toBe('R');
  });

  it('getters resolve the function form; setters replace it', () => {
    const { logger } = consoleLogger({ id: () => 'a', request: null });
    expect(logger.id).toBe('a');
    expect(logger.request).toBeNull();
    logger.id = () => 'b';
    logger.request = () => ctx({ id: 'X' });
    expect(logger.id).toBe('b');
    expect(logger.request).toMatchObject({ id: 'X' });
  });

  it('calls the id/request functions when the line is logged, not at flush', async () => {
    let current = 'A';
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { logger, buffer } = consoleLogger({ id: () => current });
    logger.info('1');
    current = 'B';
    logger.info('2');
    current = 'C';
    await buffer.flush();
    expect(spy.mock.calls.map((c) => JSON.parse(c[0] as string).id)).toEqual(['A', 'B']);
  });

  it('does not share builder changes between loggers built from one config', async () => {
    const shared: LogConfig = { channel: 'api' };
    consoleLogger(shared).logger.channel('users');
    expect(JSON.parse(await capture(shared)).channel).toBe('api');
  });

  it('per-call operation wins over the config name; status_code is written', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { logger, buffer } = consoleLogger({ name: 'cfg' });
    logger.error('m', undefined, { operation: 'call', status_code: 500 });
    await buffer.flush();
    const parsed = JSON.parse(spy.mock.calls[0][0] as string);
    expect(parsed.operation).toBe('call');
    expect(parsed.status_code).toBe(500);
  });

  it('redacts secrets in request and extraInfo', async () => {
    const dirty = { ...ctx(), bearer_token: 'secret-bearer' } as unknown as RequestLogContext;
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { logger, buffer } = consoleLogger({ request: dirty });
    logger.info('m', { password: 'hunter2' });
    await buffer.flush();
    const line = spy.mock.calls[0][0] as string;
    expect(line).not.toContain('secret-bearer');
    expect(line).not.toContain('hunter2');
  });

  it('logfmt format writes key=value pairs, flattens nested objects and is coloured; json is not', async () => {
    const line = await capture({ channel: 'api', format: 'logfmt', id: 'req-1', request: ctx() });
    expect(line).toMatch(ANSI);
    const plain = line.replace(ANSI, '');
    expect(plain).toMatch(/^timestamp=\S+ level=INFO /);
    expect(plain).toContain(' channel=api ');
    expect(plain).toContain(' id=req-1 ');
    expect(plain).toContain(' message=hello ');
    expect(plain).toContain(' request.method=GET');
    expect(plain).toMatch(/ extraInfo\.a=1\n$/);
    expect(plain).not.toContain('format=');
    expect(await capture({ channel: 'api' })).not.toMatch(ANSI);
  });
});

describe('LogService callback', () => {
  it('is called with the entry as soon as the line is logged, before any flush', async () => {
    const callback = jest.fn<Promise<void>, [LogEntry]>().mockResolvedValue(undefined);
    consoleLogger({ service: 'api', id: 'i', callback }).logger.info('m');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatchObject({ service: 'api', level: 'INFO', id: 'i', message: 'm' });
  });

  it('a rejecting callback is swallowed', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { logger, buffer } = consoleLogger({ callback: () => Promise.reject(new Error('boom')) });
    logger.info('m');
    await buffer.settle();
    expect(error).toHaveBeenCalledWith('LogService: log callback failed', expect.any(Error));
  });

  it('emailCritical mails only critical lines', async () => {
    const { logger, buffer } = consoleLogger({ service: 'api', callback: emailCritical });
    logger.info('fine');
    logger.error('handled');
    logger.critical('wake up');
    await buffer.settle();
    expect(criticalAlertMail).toHaveBeenCalledTimes(1);
    expect((criticalAlertMail as jest.Mock).mock.calls[0][0]).toMatchObject({ level: 'CRITICAL', message: 'wake up' });
  });
});

describe('InMemoryLogBuffer', () => {
  it('flush writes each pending entry once, then nothing is left', async () => {
    const driver = new MemoryDriver();
    const buffer = new InMemoryLogBuffer(driver);
    const logger = new LogService({}, buffer);
    logger.info('a');
    logger.info('b');
    expect(await buffer.length()).toBe(2);
    await buffer.flush();
    expect(driver.written.map((e) => e.message)).toEqual(['a', 'b']);
    expect(await buffer.length()).toBe(0);
  });

  it('a failed write is reported, never thrown, and the rest of the batch is still written', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const buffer = new InMemoryLogBuffer(new ConsoleLogDriver());
    const logger = new LogService({}, buffer);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    logger.info('big', { n: BigInt(10) });
    logger.info('fine');
    await expect(buffer.flush()).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith('LogBuffer: failed to write a log line', expect.any(TypeError));
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('settle waits for running callbacks and never flushes', async () => {
    const buffer = new InMemoryLogBuffer(new MemoryDriver());
    const flush = jest.spyOn(buffer, 'flush');
    let done = false;
    new LogService({ callback: async () => { await new Promise((r) => setTimeout(r, 5)); done = true; } }, buffer).info('x');
    await buffer.settle();
    expect(done).toBe(true);
    expect(flush).not.toHaveBeenCalled();
    expect(await buffer.length()).toBe(1);
  });
});

/** Enough of ioredis for the buffer: one list per key, MULTI as LRANGE + DEL. */
const fakeRedis = (lists: Map<string, string[]> = new Map()) => {
  const redis = {
    lists,
    rpush: jest.fn(async (key: string, value: string) => {
      const list = lists.get(key) ?? [];
      list.push(value);
      lists.set(key, list);
      return list.length;
    }),
    llen: jest.fn(async (key: string) => lists.get(key)?.length ?? 0),
    /** Only negative ranges, as the buffer uses them: keep the last `-start` items. */
    ltrim: jest.fn(async (key: string, start: number) => {
      lists.set(key, (lists.get(key) ?? []).slice(start));
      return 'OK';
    }),
    multi: jest.fn(() => {
      let key = '';
      const tx = {
        lrange: (k: string) => { key = k; return tx; },
        del: () => tx,
        exec: async () => {
          const items = lists.get(key) ?? [];
          lists.delete(key);
          return [[null, items], [null, items.length ? 1 : 0]];
        },
      };
      return tx;
    }),
  };
  return redis;
};

describe('RedisLogBuffer', () => {
  it('caps the list at maxLength, keeping the newest lines, and warns once', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = fakeRedis();
    const driver = new MemoryDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis, 'logs:pending', 3);
    const logger = new LogService({ service: 'api' }, buffer);
    for (const m of ['1', '2', '3']) logger.info(m);
    await buffer.settle();
    expect(redis.ltrim).not.toHaveBeenCalled();
    for (const m of ['4', '5']) logger.info(m);
    await buffer.settle();
    expect(redis.ltrim).toHaveBeenCalledWith('logs:pending', -3, -1);
    expect(await buffer.length()).toBe(3);
    await buffer.flush();
    expect(driver.written.map((e) => e.message)).toEqual(['3', '4', '5']);
    const warnings = error.mock.calls.filter(([m]) => String(m).includes('dropping the oldest'));
    expect(warnings).toHaveLength(1);
  });

  it('a failed trim is reported and never costs the pushed line', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = fakeRedis();
    redis.ltrim.mockRejectedValueOnce(new Error('OOM'));
    const driver = new MemoryDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis, 'logs:pending', 1);
    const logger = new LogService({ service: 'api' }, buffer);
    logger.info('a');
    logger.info('b');
    await buffer.settle();
    expect(error).toHaveBeenCalledWith('LogBuffer: trimming the Redis log list failed', expect.any(Error));
    expect(error).not.toHaveBeenCalledWith('LogBuffer: Redis push failed, writing the line directly', expect.anything());
    await buffer.flush();
    expect(driver.written.map((e) => e.message)).toEqual(['a', 'b']);
  });

  it('stores each entry as JSON data in one list and writes them all on flush', async () => {
    const redis = fakeRedis();
    const driver = new MemoryDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis, 'logs:test');
    const logger = new LogService({ service: 'api', id: () => 'i' }, buffer);
    logger.info('a');
    logger.warn('b', { n: 1 });
    await buffer.settle();
    await buffer.flush();
    expect(redis.rpush).toHaveBeenCalledTimes(2);
    expect(JSON.parse(redis.rpush.mock.calls[0][1])).toMatchObject({ service: 'api', id: 'i', message: 'a', format: 'json' });
    expect(driver.written.map((e) => [e.message, e.level])).toEqual([['a', 'INFO'], ['b', 'WARN']]);
    expect(await buffer.length()).toBe(0);
  });

  it('a second buffer on the same key (another process) flushes lines it did not log', async () => {
    const lists = new Map<string, string[]>();
    const driver = new MemoryDriver();
    const api = new RedisLogBuffer(new MemoryDriver(), fakeRedis(lists) as unknown as Redis);
    const worker = new RedisLogBuffer(driver, fakeRedis(lists) as unknown as Redis);
    new LogService({ service: 'api' }, api).info('from api');
    await api.flush();
    // api flushed its own; log again and let the worker flush it
    new LogService({ service: 'api' }, api).info('later');
    await new Promise((r) => setImmediate(r));
    await worker.flush();
    expect(driver.written.map((e) => e.message)).toEqual(['later']);
  });

  it('skips malformed and non-entry stored values (a path in `service` included), still writes the rest', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const entry = (over: object) => JSON.stringify({ timestamp: 't', service: 'api', level: 'INFO', message: 'ok', format: 'json', ...over });
    const lists = new Map([['logs:pending', ['not json', 'null', '42', '"str"', entry({ service: '../../x' }), entry({})]]]);
    const driver = new MemoryDriver();
    await new RedisLogBuffer(driver, fakeRedis(lists) as unknown as Redis).flush();
    expect(driver.written.map((e) => e.message)).toEqual(['ok']);
    expect(error).toHaveBeenCalledWith('LogBuffer: skipping a malformed stored log line', expect.any(SyntaxError));
    expect(error).toHaveBeenCalledWith('LogBuffer: skipping a stored value that is not a log entry');
  });

  it('a Redis error in flush is reported, never thrown, and the lines stay queued', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const lists = new Map([['logs:pending', ['x']]]);
    const redis = fakeRedis(lists);
    redis.multi.mockImplementationOnce(() => ({
      lrange: function () { return this; },
      del: function () { return this; },
      exec: async () => { throw new Error('Connection is closed.'); },
    }) as never);
    await expect(new RedisLogBuffer(new MemoryDriver(), redis as unknown as Redis).flush()).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith('LogBuffer: Redis flush failed, the lines stay queued', expect.any(Error));
    expect(lists.get('logs:pending')).toEqual(['x']);
  });

  it('flush waits for its own pushes still in flight (an auto-pipelining client)', async () => {
    const redis = fakeRedis();
    const push = redis.rpush.getMockImplementation()!;
    redis.rpush.mockImplementation((key: string, value: string) =>
      new Promise((resolve) => setTimeout(resolve, 10)).then(() => push(key, value)));
    const driver = new MemoryDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis);
    const logger = new LogService({}, buffer);
    logger.info('a');
    logger.info('b');
    await buffer.flush();
    expect(driver.written.map((e) => e.message)).toEqual(['a', 'b']);
  });

  it('when Redis is down the line is written directly, never lost', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = fakeRedis();
    redis.rpush.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const driver = new MemoryDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis);
    new LogService({}, buffer).critical('down');
    await buffer.settle();
    expect(driver.written.map((e) => e.message)).toEqual(['down']);
  });

  it('an unserialisable line is reported, and logging never throws', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = fakeRedis();
    const buffer = new RedisLogBuffer(new MemoryDriver(), redis as unknown as Redis);
    expect(() => new LogService({}, buffer).info('big', { n: BigInt(1) })).not.toThrow();
    expect(redis.rpush).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('LogBuffer: a log line could not be serialised', expect.any(TypeError));
  });
});

describe('process logBuffer', () => {
  it('a second copy of config/logging (another bundle) gets the same logBuffer', () => {
    let copy: unknown;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      copy = require('../../../config/logging').logBuffer;
    });
    expect(copy).toBe(logBuffer);
  });

  it('can not be replaced', () => {
    const key = Symbol.for('@repo/backend-lib/logBuffer');
    expect(() => {
      (globalThis as Record<symbol, unknown>)[key] = new InMemoryLogBuffer(new MemoryDriver());
    }).toThrow(TypeError);
    expect((globalThis as Record<symbol, unknown>)[key]).toBe(logBuffer);
  });
});
