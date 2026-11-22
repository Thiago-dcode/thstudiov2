jest.mock('../../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import type Redis from 'ioredis';
import { LogService } from '../log.service';
import { InMemoryLogBuffer } from '../buffers/in-memory-log.buffer';
import { RedisLogBuffer } from '../buffers/redis-log.buffer';
import { ConsoleLogDriver } from '../drivers/console-log.driver';
import { LogDriver } from '../drivers/log.driver';
import { LogConfig, LogContext, LogEntryBase, LogObjectEntry } from '../types';
import { logBuffer } from '../../../config/logging';

// LogService is a generic library: these tests use its own default entry builder and know nothing
// of channels, request types or the project's line shape (see config/__tests__/logging.entry.test.ts).

type Ctx = { id: string; user?: number };

/** Records every (logContext, entry) it is given. */
class MemoryDriver extends LogDriver<LogEntryBase> {
  written: LogEntryBase[] = [];
  contexts: LogContext[] = [];
  async process(logContext: LogContext, entry: LogEntryBase): Promise<void> {
    this.contexts.push(logContext);
    this.written.push(entry);
  }
}

/** A logger over an in-memory buffer and a recording driver. */
const memoryLogger = <T extends LogObjectEntry = Ctx>(config: LogConfig<T> = {}) => {
  const driver = new MemoryDriver();
  const buffer = new InMemoryLogBuffer(driver);
  return { logger: new LogService<T, LogEntryBase>(config, buffer), buffer, driver };
};

/** Logs through the console driver on flush and returns what it printed. */
const printed = async (config: LogConfig<Ctx>) => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const buffer = new InMemoryLogBuffer(new ConsoleLogDriver<LogEntryBase>());
  const logger = new LogService<Ctx, LogEntryBase>(config, buffer);
  logger.info('hello', { a: 1 });
  await buffer.flush();
  return spy.mock.calls.map((call) => call[0] as string);
};

afterEach(() => jest.restoreAllMocks());

describe('LogService calls', () => {
  it('level methods take exactly two arguments: a message and options', () => {
    for (const level of ['info', 'error', 'warn', 'debug', 'success', 'critical'] as const) {
      expect(LogService.prototype[level].length).toBe(2);
    }
  });

  it('writes the message, the level, the options and the format into the entry', async () => {
    const { logger, buffer, driver } = memoryLogger();
    logger.warn('careful', { n: 1 });
    await buffer.flush();
    expect(driver.written[0]).toMatchObject({ level: 'warn', message: 'careful', format: 'json', options: { n: 1 } });
    expect(driver.written[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('hands the driver a LogContext with a Date timestamp and the raw options', async () => {
    const { logger, buffer, driver } = memoryLogger({ service: 'api' });
    logger.info('m', { a: 1 });
    await buffer.flush();
    expect(driver.contexts[0]).toMatchObject({ level: 'info', message: 'm', service: 'api', format: 'json', logOptions: { a: 1 } });
    expect(driver.contexts[0].timestamp).toBeInstanceOf(Date);
  });

  it('every level method logs one line and returns the logger', async () => {
    const { logger, buffer, driver } = memoryLogger();
    for (const level of ['info', 'error', 'warn', 'debug', 'success', 'critical'] as const) {
      expect(logger[level](level)).toBe(logger);
    }
    await buffer.flush();
    expect(driver.written.map((e) => e.level)).toEqual(['info', 'error', 'warn', 'debug', 'success', 'critical']);
  });

  it('redacts secrets in the options and the globalContext of the entry', async () => {
    const dirty = { id: 'r', bearer_token: 'secret-bearer' } as Ctx;
    const { logger, buffer, driver } = memoryLogger<Ctx>({ globalContext: () => dirty });
    logger.info('m', { password: 'hunter2', user_id: 7 });
    await buffer.flush();
    const text = JSON.stringify(driver.written[0]);
    expect(text).not.toContain('secret-bearer');
    expect(text).not.toContain('hunter2');
    expect(driver.written[0].options).toMatchObject({ user_id: 7 });
  });
});

describe('LogService defaultOptions', () => {
  it('starts every line from the defaults; the call wins on a clash', async () => {
    const { logger, buffer, driver } = memoryLogger({ defaultOptions: { channel: 'media', operation: 'create' } });
    logger.info('a');
    logger.info('b', { operation: 'call', extra: 1 });
    await buffer.flush();
    expect(driver.contexts[0].logOptions).toEqual({ channel: 'media', operation: 'create' });
    expect(driver.contexts[1].logOptions).toEqual({ channel: 'media', operation: 'call', extra: 1 });
  });

  it('flattens an Error under the defaults as { name, message, stack }', async () => {
    const { logger, buffer, driver } = memoryLogger({ defaultOptions: { channel: 'ai', operation: 'llm-call' } });
    const failure = new TypeError('nope');
    logger.error('failed', failure);
    await buffer.flush();
    expect(driver.contexts[0].logOptions).toEqual({
      channel: 'ai',
      operation: 'llm-call',
      name: 'TypeError',
      message: 'nope',
      stack: failure.stack,
    });
  });

  it('without defaults the options reach the context as they were passed', async () => {
    const { logger, buffer, driver } = memoryLogger();
    const failure = new Error('raw');
    logger.error('failed', failure);
    logger.info('none');
    await buffer.flush();
    expect(driver.contexts[0].logOptions).toBe(failure);
    expect(driver.contexts[1].logOptions).toBeUndefined();
  });

  it('does not mutate the defaults or the call options', async () => {
    const defaults = { channel: 'media' };
    const options = { extra: 1 };
    const { logger, buffer } = memoryLogger({ defaultOptions: defaults });
    logger.info('x', options);
    await buffer.flush();
    expect(defaults).toEqual({ channel: 'media' });
    expect(options).toEqual({ extra: 1 });
  });
});

describe('LogService per-line resolution', () => {
  it('service, id and globalContext are read on every line, when it is logged, not at flush', async () => {
    let current = 'A';
    const { logger, buffer, driver } = memoryLogger<Ctx>({
      service: () => `svc-${current}`,
      id: () => current,
      globalContext: () => ({ id: current }),
    });
    logger.info('1');
    current = 'B';
    logger.info('2');
    current = 'C';
    await buffer.flush();
    expect(driver.contexts.map((c) => [c.service, c.id])).toEqual([['svc-A', 'A'], ['svc-B', 'B']]);
    expect(driver.written.map((e) => e.globalContext)).toEqual([{ id: 'A' }, { id: 'B' }]);
  });

  it('value forms are used as they are', async () => {
    const { logger, buffer, driver } = memoryLogger({ service: 'worker', id: 'fixed' });
    logger.info('x');
    await buffer.flush();
    expect(driver.contexts[0]).toMatchObject({ service: 'worker', id: 'fixed' });
    expect(logger.id).toBe('fixed');
  });

  it('defaults service to unknown and id to null, and writes no globalContext', async () => {
    const { logger, buffer, driver } = memoryLogger();
    logger.info('x');
    await buffer.flush();
    expect(driver.contexts[0]).toMatchObject({ service: 'unknown', id: null });
    expect('globalContext' in driver.written[0]).toBe(false);
    expect('options' in driver.written[0]).toBe(false);
  });

  it('the id getter resolves the function form', () => {
    expect(memoryLogger({ id: () => 'a' }).logger.id).toBe('a');
    expect(memoryLogger({ id: () => null }).logger.id).toBeNull();
    expect(memoryLogger({}).logger.id).toBeNull();
  });

  it('globalContext receives the line being logged', async () => {
    const seen: LogContext[] = [];
    const { logger, buffer } = memoryLogger<Ctx>({ globalContext: (logContext) => (seen.push(logContext), { id: logContext.message }) });
    logger.error('why');
    await buffer.flush();
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ level: 'error', message: 'why' });
  });

  it('a throwing resolver never loses the line: service falls back to unknown, id and globalContext to nothing', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const callback = jest.fn().mockResolvedValue(undefined);
    const { logger, buffer, driver } = memoryLogger<Ctx>({
      callback,
      service: () => { throw new Error('service boom'); },
      id: () => { throw new Error('id boom'); },
      globalContext: () => { throw new Error('ctx boom'); },
    });
    logger.critical('still here');
    await buffer.flush();
    await buffer.settle();
    expect(driver.contexts).toEqual([expect.objectContaining({ message: 'still here', service: 'unknown', id: null })]);
    expect('globalContext' in driver.written[0]).toBe(false);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ message: 'still here' }), undefined);
    expect(error).toHaveBeenCalledTimes(3);
  });

  it('reads globalContext once per line: the entry and the callback see the same value', async () => {
    let calls = 0;
    const callback = jest.fn().mockResolvedValue(undefined);
    const { logger, buffer, driver } = memoryLogger<Ctx>({ callback, globalContext: () => ({ id: `r${++calls}` }) });
    logger.info('x');
    await buffer.settle();
    await buffer.flush();
    expect(calls).toBe(1);
    expect(driver.written[0].globalContext).toEqual({ id: 'r1' });
    expect(callback.mock.calls[0][1]).toEqual({ id: 'r1' });
  });
});

describe('LogService is immutable', () => {
  it('has no name, channel, service or flush member, and no setter for id or globalContext (AC-2)', () => {
    for (const member of ['name', 'channel', 'service', 'flush']) {
      expect(member in LogService.prototype).toBe(false);
    }
    const id = Object.getOwnPropertyDescriptor(LogService.prototype, 'id');
    expect(id?.get).toEqual(expect.any(Function));
    expect(id?.set).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(LogService.prototype, 'globalContext')).toBeUndefined();
  });

  it('a caller mutating its config object later cannot change a built logger', async () => {
    const config: LogConfig<Ctx> = { service: 'one', id: 'first', defaultOptions: { channel: 'a' } };
    const { logger, buffer, driver } = memoryLogger<Ctx>(config);
    config.service = 'two';
    config.id = 'second';
    config.defaultOptions = { channel: 'b' };
    logger.info('x');
    await buffer.flush();
    expect(driver.contexts[0]).toMatchObject({ service: 'one', id: 'first', logOptions: { channel: 'a' } });
  });

  it('loggers built from one config share nothing between them', async () => {
    const shared: LogConfig<Ctx> = { defaultOptions: { channel: 'api' } };
    const a = memoryLogger<Ctx>(shared);
    const b = memoryLogger<Ctx>({ ...shared, id: 'b' });
    a.logger.info('a');
    b.logger.info('b');
    await a.buffer.flush();
    await b.buffer.flush();
    expect(a.driver.contexts[0]).toMatchObject({ id: null, logOptions: { channel: 'api' } });
    expect(b.driver.contexts[0]).toMatchObject({ id: 'b', logOptions: { channel: 'api' } });
  });
});

describe('LogService entry builder', () => {
  it('a custom builder gets the line and its globalContext and decides the entry', async () => {
    const driver = new MemoryDriver();
    const buffer = new InMemoryLogBuffer(driver);
    const builder = jest.fn((logContext: LogContext, globalContext?: Ctx) => ({
      timestamp: logContext.timestamp.toISOString(),
      level: logContext.level.toUpperCase(),
      service: logContext.service,
      message: logContext.message,
      format: logContext.format,
      who: globalContext?.id ?? null,
    }));
    new LogService<Ctx, LogEntryBase>({ service: 'api', globalContext: () => ({ id: 'me' }) }, buffer, builder).info('hi', { a: 1 });
    await buffer.flush();
    expect(builder).toHaveBeenCalledWith(expect.objectContaining({ message: 'hi', logOptions: { a: 1 } }), { id: 'me' });
    expect(driver.written[0]).toMatchObject({ level: 'INFO', who: 'me', service: 'api' });
  });
});

describe('LogService callback', () => {
  it('is called with the line and its globalContext as soon as it is logged, before any flush', () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    memoryLogger<Ctx>({ service: 'api', id: 'i', globalContext: () => ({ id: 'r' }), callback }).logger.info('m');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatchObject({ service: 'api', level: 'info', id: 'i', message: 'm' });
    expect(callback.mock.calls[0][1]).toEqual({ id: 'r' });
  });

  it('a rejecting callback is swallowed and reported', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { logger, buffer } = memoryLogger({ callback: () => Promise.reject(new Error('boom')) });
    logger.info('m');
    await buffer.settle();
    expect(error).toHaveBeenCalledWith('LogService: log callback failed', expect.any(Error));
  });

  it('the line is still queued when the callback fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { logger, buffer, driver } = memoryLogger({ callback: () => Promise.reject(new Error('boom')) });
    logger.critical('kept');
    await buffer.settle();
    await buffer.flush();
    expect(driver.written.map((e) => e.message)).toEqual(['kept']);
  });

  it('settle waits for a slow callback, and flush does not', async () => {
    let release!: () => void;
    let done = false;
    const callback = jest.fn(() => new Promise<void>((resolve) => { release = resolve; }).then(() => { done = true; }));
    const { logger, buffer, driver } = memoryLogger({ callback });
    logger.critical('boom');
    await buffer.flush();
    expect(driver.written).toHaveLength(1);
    expect(done).toBe(false);
    const settled = buffer.settle();
    release();
    await settled;
    expect(done).toBe(true);
  });
});

describe('ConsoleLogDriver through LogService', () => {
  it('prints one line per entry, routed by the lowercase level, with no trailing blank line', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    const buffer = new InMemoryLogBuffer(new ConsoleLogDriver<LogEntryBase>());
    const logger = new LogService<Ctx, LogEntryBase>({}, buffer);
    for (const level of ['info', 'success', 'error', 'critical', 'warn', 'debug'] as const) logger[level](level);
    await buffer.flush();
    expect(logSpy.mock.calls.map(([line]) => JSON.parse(line).message).sort()).toEqual(['info', 'success']);
    expect(errorSpy.mock.calls.map(([line]) => JSON.parse(line).message).sort()).toEqual(['critical', 'error']);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).toHaveBeenCalledTimes(1);
    for (const spy of [logSpy, errorSpy, warnSpy, debugSpy]) {
      for (const [line] of spy.mock.calls) expect(String(line).endsWith('\n')).toBe(false);
    }
  });

  it('json lines carry no ANSI escape codes', async () => {
    const lines = await printed({ service: 'api' });
    expect(lines[0]).not.toContain(String.fromCharCode(27));
    expect(JSON.parse(lines[0])).toMatchObject({ service: 'api', message: 'hello' });
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

describe('InMemoryLogBuffer', () => {
  it('flush writes each pending line once, then nothing is left', async () => {
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

  it('add takes the context and the entry, and flush hands both to the driver', async () => {
    const driver = new MemoryDriver();
    const buffer = new InMemoryLogBuffer(driver);
    const logContext: LogContext = { timestamp: new Date(), level: 'info', service: 'api', message: 'direct', format: 'json', id: null };
    const entry: LogEntryBase = { timestamp: logContext.timestamp.toISOString(), level: 'info', service: 'api', message: 'direct', format: 'json' };
    buffer.add(logContext, entry);
    await buffer.flush();
    expect(driver.contexts[0]).toBe(logContext);
    expect(driver.written[0]).toBe(entry);
  });

  it('a failed write is reported, never thrown, and the rest of the batch is still written', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const buffer = new InMemoryLogBuffer(new ConsoleLogDriver<LogEntryBase>());
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

  it('stores each line as JSON data ({ logContext, entry }) in one list and writes them all on flush', async () => {
    const redis = fakeRedis();
    const driver = new MemoryDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis, 'logs:test');
    const logger = new LogService({ service: 'api', id: () => 'i' }, buffer);
    logger.info('a');
    logger.warn('b', { n: 1 });
    await buffer.settle();
    await buffer.flush();
    expect(redis.rpush).toHaveBeenCalledTimes(2);
    const stored = JSON.parse(redis.rpush.mock.calls[0][1]);
    expect(stored.logContext).toMatchObject({ service: 'api', id: 'i', message: 'a', format: 'json', level: 'info' });
    expect(stored.entry).toMatchObject({ service: 'api', id: 'i', message: 'a', format: 'json' });
    expect(driver.written.map((e) => [e.message, e.level])).toEqual([['a', 'info'], ['b', 'warn']]);
    expect(await buffer.length()).toBe(0);
  });

  it('the driver gets the context back with a Date timestamp, and never the raw logOptions', async () => {
    const redis = fakeRedis();
    const driver = new MemoryDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis);
    new LogService({ service: 'api' }, buffer).info('probe', { password: 'hunter2' });
    await buffer.settle();
    expect(redis.rpush.mock.calls[0][1]).not.toContain('hunter2');
    expect('logOptions' in JSON.parse(redis.rpush.mock.calls[0][1]).logContext).toBe(false);
    await buffer.flush();
    expect(driver.contexts[0].timestamp).toBeInstanceOf(Date);
    expect(Number.isNaN(driver.contexts[0].timestamp.getTime())).toBe(false);
    expect(driver.contexts[0].logOptions).toBeUndefined();
    expect(JSON.stringify(driver.written[0])).not.toContain('hunter2');
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
    const stored = (service: string) => JSON.stringify({
      logContext: { timestamp: new Date().toISOString(), service, level: 'info', message: 'ok', format: 'json', id: null },
      entry: { timestamp: 't', service, level: 'info', message: 'ok', format: 'json' },
    });
    const lists = new Map([['logs:pending', [
      'not json',
      'null',
      '42',
      '"str"',
      // the pre-contract shape: a bare entry, no logContext
      JSON.stringify({ timestamp: 't', service: 'api', level: 'INFO', message: 'old', format: 'json' }),
      stored('../../x'),
      stored('api'),
    ]]]);
    const driver = new MemoryDriver();
    await new RedisLogBuffer(driver, fakeRedis(lists) as unknown as Redis).flush();
    expect(driver.written.map((e) => e.message)).toEqual(['ok']);
    expect(driver.contexts.map((c) => c.service)).toEqual(['api']);
    expect(error).toHaveBeenCalledWith('LogBuffer: skipping a malformed stored log line', expect.any(SyntaxError));
    expect(error).toHaveBeenCalledWith('LogBuffer: skipping a stored value that is not a log entry');
  });

  it('skips a stored line whose timestamp is invalid', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const bad = JSON.stringify({
      logContext: { timestamp: 'not a date', service: 'api', level: 'info', message: 'x', format: 'json', id: null },
      entry: { message: 'x' },
    });
    const driver = new MemoryDriver();
    await new RedisLogBuffer(driver, fakeRedis(new Map([['logs:pending', [bad]]])) as unknown as Redis).flush();
    expect(driver.written).toEqual([]);
    expect(error).toHaveBeenCalledWith('LogBuffer: skipping a stored log line with an invalid timestamp');
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

  it('when Redis is down the line is written directly with its context, never lost', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = fakeRedis();
    redis.rpush.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const driver = new MemoryDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis);
    new LogService({ service: 'api' }, buffer).critical('down');
    await buffer.settle();
    expect(driver.written.map((e) => e.message)).toEqual(['down']);
    expect(driver.contexts[0]).toMatchObject({ service: 'api', level: 'critical' });
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
