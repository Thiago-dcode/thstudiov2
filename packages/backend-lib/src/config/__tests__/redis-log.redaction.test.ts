import type Redis from 'ioredis';
import { LogService } from '../../services/log-service/log.service';
import { RedisLogBuffer } from '../../services/log-service/buffers/redis-log.buffer';
import { LogDriver } from '../../services/log-service/drivers/log.driver';
import type { LogContext } from '../../services/log-service/types';
import { buildLogEntry, type LogEntry } from '../logging';

// AC-12 (security regression). The real LogService + buildLogEntry + a real RedisLogBuffer over a
// fake ioredis that records every command, and a recording driver. A raw secret passed in the call's
// options must never reach Redis; only the redacted entry may.

type Command = { name: string; args: unknown[] };

/** Enough of ioredis for the buffer, recording every command (and its arguments) it receives. */
const fakeRedis = (lists: Map<string, string[]> = new Map()) => {
  const commands: Command[] = [];
  const record = (name: string, ...args: unknown[]) => void commands.push({ name, args });
  const redis = {
    lists,
    commands,
    rpush: jest.fn(async (key: string, value: string) => {
      record('rpush', key, value);
      const list = lists.get(key) ?? [];
      list.push(value);
      lists.set(key, list);
      return list.length;
    }),
    llen: jest.fn(async (key: string) => {
      record('llen', key);
      return lists.get(key)?.length ?? 0;
    }),
    ltrim: jest.fn(async (key: string, start: number, stop: number) => {
      record('ltrim', key, start, stop);
      lists.set(key, (lists.get(key) ?? []).slice(start));
      return 'OK';
    }),
    multi: jest.fn(() => {
      let key = '';
      const tx = {
        lrange: (k: string, from: number, to: number) => { record('lrange', k, from, to); key = k; return tx; },
        del: (k: string) => { record('del', k); return tx; },
        exec: async () => {
          record('exec');
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

/** Records what the driver is given, and the line it would write (the real formatter). */
class RecordingDriver extends LogDriver<LogEntry> {
  contexts: LogContext[] = [];
  entries: LogEntry[] = [];
  lines: string[] = [];
  async process(logContext: LogContext, entry: LogEntry): Promise<void> {
    this.contexts.push(logContext);
    this.entries.push(entry);
    this.lines.push(this.formatLogEntry(logContext.format, entry));
  }
}

const SECRETS = ['"password":"x"', '"token":"y"', '"apiKey":"z"', '"z"', 'ctx-secret', 'hunter2'];

const build = (over: { redis?: ReturnType<typeof fakeRedis>; maxLength?: number } = {}) => {
  const redis = over.redis ?? fakeRedis();
  const driver = new RecordingDriver();
  const buffer = new RedisLogBuffer<LogEntry>(driver, redis as unknown as Redis, 'logs:pending', over.maxLength);
  const logger = new LogService<any, LogEntry>(
    {
      service: 'api',
      // A request context that (wrongly) carries a secret: the line's `request` is redacted too.
      globalContext: () => ({ id: 'req-1', method: 'POST', path: '/x', token: 'ctx-secret' }),
    },
    buffer,
    buildLogEntry,
  );
  return { redis, driver, buffer, logger };
};

const logSecrets = (logger: LogService<any, LogEntry>) => {
  logger.info('probe', { password: 'x', token: 'y', user_id: 7, nested: { apiKey: 'z' }, channel: 'auth', operation: 'login' });
  logger.error('boom', Object.assign(new Error('db exploded'), { password: 'hunter2' }));
};

const pushed = (redis: ReturnType<typeof fakeRedis>) =>
  redis.commands.filter((c) => c.name === 'rpush').map((c) => c.args[1] as string);

describe('AC-12: the Redis log buffer never stores raw log options', () => {
  afterEach(() => jest.restoreAllMocks());

  it('AC-12a: no RPUSH payload has a logOptions key or any raw secret', async () => {
    const { redis, buffer, logger } = build();
    logSecrets(logger);
    await buffer.settle();

    const payloads = pushed(redis);
    expect(payloads).toHaveLength(2);
    for (const payload of payloads) {
      const stored = JSON.parse(payload);
      expect(Object.keys(stored).sort()).toEqual(['entry', 'logContext']);
      expect(stored.logContext).not.toHaveProperty('logOptions');
      expect(payload).not.toContain('logOptions');
      for (const secret of SECRETS) expect(payload).not.toContain(secret);
    }
  });

  it('AC-12a: nothing in any recorded Redis command (arguments of every command) holds a raw secret', async () => {
    const { redis, buffer, logger } = build();
    logSecrets(logger);
    await buffer.settle();
    await buffer.flush();

    const everything = JSON.stringify(redis.commands);
    expect(redis.commands.map((c) => c.name)).toEqual(expect.arrayContaining(['rpush', 'lrange', 'del', 'exec']));
    for (const secret of SECRETS) expect(everything).not.toContain(secret);
  });

  it('AC-12b: the stored entry holds [REDACTED] for password, token and a nested apiKey, and keeps user_id', async () => {
    const { redis, buffer, logger } = build();
    logSecrets(logger);
    await buffer.settle();

    const [probe, failure] = pushed(redis).map((p) => JSON.parse(p).entry);
    expect(probe.extraInfo.password).toBe('[REDACTED]');
    expect(probe.extraInfo.token).toBe('[REDACTED]');
    expect(probe.extraInfo.nested.apiKey).toBe('[REDACTED]');
    expect(probe.extraInfo.user_id).toBe(7);
    // channel / operation are lifted to the top level, never left in extraInfo
    expect(probe).toMatchObject({ channel: 'auth', operation: 'login', service: 'api', level: 'INFO', message: 'probe', id: '' });
    expect(probe.extraInfo).not.toHaveProperty('channel');
    expect(probe.extraInfo).not.toHaveProperty('operation');
    // the request context is redacted as well
    expect(probe.request.token).toBe('[REDACTED]');
    expect(probe.request.path).toBe('/x');

    // an Error is stored as { name, message, stack } and keeps no extra own property of the error
    expect(failure.level).toBe('ERROR');
    expect(failure.extraInfo).toEqual({ name: 'Error', message: 'db exploded', stack: expect.stringContaining('db exploded') });
  });

  it('AC-12c: flush writes every line through the driver, with a Date timestamp and the same line shape', async () => {
    const { redis, driver, buffer, logger } = build();
    logSecrets(logger);
    await buffer.settle();
    const stored = pushed(redis).map((p) => JSON.parse(p));

    await buffer.flush();

    expect(driver.entries).toHaveLength(2);
    expect(driver.contexts).toHaveLength(2);
    for (const context of driver.contexts) {
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(Number.isNaN(context.timestamp.getTime())).toBe(false);
      expect(context).not.toHaveProperty('logOptions');
    }
    expect(driver.contexts.map((c) => [c.level, c.service, c.message])).toEqual([
      ['info', 'api', 'probe'],
      ['error', 'api', 'boom'],
    ]);
    // the driver gets exactly the entry that was stored, key order included
    expect(driver.entries).toEqual(stored.map((s) => s.entry));
    expect(driver.entries.map((e) => Object.keys(e))).toEqual(stored.map((s) => Object.keys(s.entry)));
    // the context's timestamp is the entry's timestamp
    expect(driver.contexts.map((c) => c.timestamp.toISOString())).toEqual(driver.entries.map((e) => e.timestamp));
    // the written lines have no raw secret and no `format` key
    for (const line of driver.lines) {
      for (const secret of SECRETS) expect(line).not.toContain(secret);
      expect(line).not.toContain('"format"');
    }
    expect(await buffer.length()).toBe(0);
  });

  it('AC-12c: a logfmt line is written from the stored line as well (no raw secret)', async () => {
    const redis = fakeRedis();
    const driver = new RecordingDriver();
    const buffer = new RedisLogBuffer<LogEntry>(driver, redis as unknown as Redis);
    const logger = new LogService<any, LogEntry>({ service: 'worker', format: 'logfmt' }, buffer, buildLogEntry);
    logger.warn('fmt', { password: 'x', user_id: 7 });
    await buffer.settle();
    await buffer.flush();

    expect(driver.lines).toHaveLength(1);
    expect(driver.lines[0]).toContain('extraInfo.password=[REDACTED]');
    expect(driver.lines[0]).toContain('extraInfo.user_id=7');
    expect(driver.lines[0]).toContain('level=WARN');
    expect(driver.lines[0]).not.toMatch(/password=x\b/);
    expect(driver.contexts[0].format).toBe('logfmt');
  });

  it('AC-12d: when RPUSH rejects (Redis down) the fallback writes the redacted line through the driver', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const redis = fakeRedis();
    redis.rpush.mockRejectedValue(new Error('ECONNREFUSED'));
    const { driver, buffer, logger } = build({ redis });

    logSecrets(logger);
    await buffer.settle();

    expect(error).toHaveBeenCalledWith('LogBuffer: Redis push failed, writing the line directly', expect.any(Error));
    expect(driver.entries).toHaveLength(2);
    expect(driver.contexts[0]).toMatchObject({ level: 'info', service: 'api', message: 'probe' });
    expect(driver.contexts[0].timestamp).toBeInstanceOf(Date);
    expect(driver.entries[0].extraInfo).toMatchObject({ password: '[REDACTED]', token: '[REDACTED]', user_id: 7 });
    for (const line of driver.lines) {
      for (const secret of SECRETS) expect(line).not.toContain(secret);
    }
    // nothing but the failed RPUSH attempts reached Redis
    expect(redis.commands.every((c) => c.name === 'rpush')).toBe(true);
  });

  it('AC-12d: a client factory that throws also writes the line directly, redacted', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const driver = new RecordingDriver();
    const buffer = new RedisLogBuffer<LogEntry>(driver, () => { throw new Error('no redis'); });
    const logger = new LogService<any, LogEntry>({ service: 'api' }, buffer, buildLogEntry);
    logger.info('probe', { password: 'x', token: 'y', nested: { apiKey: 'z' } });
    await buffer.settle();

    expect(error).toHaveBeenCalled();
    expect(driver.lines).toHaveLength(1);
    for (const secret of SECRETS) expect(driver.lines[0]).not.toContain(secret);
    expect(driver.lines[0]).toContain('[REDACTED]');
  });
});

describe('RedisLogBuffer: reading back stored lines', () => {
  afterEach(() => jest.restoreAllMocks());

  const validStored = (over: Record<string, unknown> = {}) =>
    JSON.stringify({
      logContext: { timestamp: '2026-11-14T12:00:00.000Z', level: 'info', service: 'api', message: 'ok', format: 'json', id: null, ...over },
      entry: { timestamp: '2026-11-14T12:00:00.000Z', level: 'INFO', service: 'api', message: 'ok' },
    });

  it('skips malformed and old-format stored lines with an error, and still writes the valid ones', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const oldFormat = JSON.stringify({ timestamp: '2026-11-14T12:00:00.000Z', level: 'INFO', service: 'api', message: 'old', channel: 'system' });
    const lists = new Map([[
      'logs:pending',
      [
        '{not json',
        oldFormat,
        JSON.stringify([1, 2]),
        JSON.stringify({ logContext: { service: 'api' }, entry: {} }),
        validStored({ service: '../etc' }),
        validStored({ service: 'Api' }),
        validStored({ timestamp: 'not-a-date' }),
        validStored({ message: 7 }),
        validStored(),
      ],
    ]]);
    const driver = new RecordingDriver();
    const buffer = new RedisLogBuffer<LogEntry>(driver, fakeRedis(lists) as unknown as Redis);

    await expect(buffer.flush()).resolves.toBeUndefined();

    expect(driver.contexts).toHaveLength(1);
    expect(driver.entries[0].message).toBe('ok');
    expect(driver.contexts[0].timestamp).toBeInstanceOf(Date);
    const reported = error.mock.calls.map(([message]) => String(message));
    expect(reported.filter((m) => m.includes('malformed stored log line'))).toHaveLength(1);
    expect(reported.filter((m) => m.includes('not a log entry'))).toHaveLength(6);
    expect(reported.filter((m) => m.includes('invalid timestamp'))).toHaveLength(1);
  });

  it('a stored line is read back with the same key set the writer put in', async () => {
    const { redis, driver, buffer, logger } = build();
    logger.info('shape', { operation: 'op', status_code: 201, method: 'password' });
    await buffer.settle();
    const [{ logContext }] = pushed(redis).map((p) => JSON.parse(p));
    expect(Object.keys(logContext).sort()).toEqual(['format', 'id', 'level', 'message', 'service', 'timestamp']);

    await buffer.flush();
    expect(driver.entries[0]).toMatchObject({ operation: 'op', status_code: 201, method: 'password', level: 'INFO' });
  });
});
