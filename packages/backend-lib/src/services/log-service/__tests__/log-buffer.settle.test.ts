jest.mock('../../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import fs from 'node:fs';
import path from 'node:path';
import type Redis from 'ioredis';
import { LogService } from '../log.service';
import { LogBuffer } from '../buffers/log.buffer';
import { InMemoryLogBuffer } from '../buffers/in-memory-log.buffer';
import { DEFAULT_LOG_REDIS_KEY, RedisLogBuffer } from '../buffers/redis-log.buffer';
import { LogDriver } from '../drivers/log.driver';
import { LogEntry } from '../types';
import * as logServiceIndex from '../index';

class SpyDriver extends LogDriver {
  process = jest.fn(async (_entry: LogEntry): Promise<void> => undefined);
}

const fakeRedis = () => {
  const lists = new Map<string, string[]>();
  return {
    lists,
    rpush: jest.fn(async (key: string, value: string) => {
      const list = lists.get(key) ?? [];
      list.push(value);
      lists.set(key, list);
      return list.length;
    }),
    llen: jest.fn(async (key: string) => lists.get(key)?.length ?? 0),
    multi: jest.fn(),
  };
};

afterEach(() => jest.restoreAllMocks());

describe('AC-1 buffer file layout and exports', () => {
  const dir = path.join(__dirname, '..');

  it('AC-1: the three buffer files exist and the old log-storage files are gone', () => {
    for (const f of ['log.buffer.ts', 'in-memory-log.buffer.ts', 'redis-log.buffer.ts']) {
      expect(fs.existsSync(path.join(dir, 'buffers', f))).toBe(true);
    }
    for (const f of ['log-storage.service.ts', 'log-storage-in-memory.service.ts', 'log-storage-redis.service.ts']) {
      expect(fs.existsSync(path.join(dir, f))).toBe(false);
    }
  });

  it('AC-1: exports LogBuffer (abstract), InMemoryLogBuffer, RedisLogBuffer and DEFAULT_LOG_REDIS_KEY = logs:pending', () => {
    expect(DEFAULT_LOG_REDIS_KEY).toBe('logs:pending');
    expect(new InMemoryLogBuffer(new SpyDriver())).toBeInstanceOf(LogBuffer);
    expect(new RedisLogBuffer(new SpyDriver(), fakeRedis() as unknown as Redis)).toBeInstanceOf(LogBuffer);
    expect(logServiceIndex).toMatchObject({ LogBuffer, InMemoryLogBuffer, RedisLogBuffer });
  });
});

describe('AC-3 no async flush, no LogService.flush', () => {
  it('AC-3: buffers expose no async flush or flush-and-settle; LogService has no flush', () => {
    const buffers = [new InMemoryLogBuffer(new SpyDriver()), new RedisLogBuffer(new SpyDriver(), fakeRedis() as unknown as Redis)];
    for (const b of buffers) {
      expect((b as unknown as Record<string, unknown>)['flush' + 'Async']).toBeUndefined();
      expect((b as unknown as Record<string, unknown>)['flush' + 'AndSettle']).toBeUndefined();
      expect(typeof b.settle).toBe('function');
    }
    const logger = new LogService({}, buffers[0]);
    expect((logger as unknown as Record<string, unknown>).flush).toBeUndefined();
    expect('flush' in LogService.prototype).toBe(false);
  });
});

describe('AC-6 settle', () => {
  it('AC-6: resolves only after every tracked promise settled, including ones tracked while it waits', async () => {
    const buffer = new InMemoryLogBuffer(new SpyDriver());
    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    const first = new Promise<void>((r) => (releaseFirst = r));
    const second = new Promise<void>((r) => (releaseSecond = r));
    buffer.track(first);

    let settled = false;
    const done = buffer.settle().then(() => (settled = true));
    await new Promise((r) => setImmediate(r));
    expect(settled).toBe(false);

    // tracked while settle() is already waiting
    buffer.track(second);
    releaseFirst();
    await new Promise((r) => setImmediate(r));
    expect(settled).toBe(false);

    releaseSecond();
    await done;
    expect(settled).toBe(true);
  });

  it('AC-6: never calls flush(), never writes through the driver', async () => {
    const driver = new SpyDriver();
    const buffer = new InMemoryLogBuffer(driver);
    const flush = jest.spyOn(buffer, 'flush');
    new LogService({ callback: async () => undefined }, buffer).info('x');
    await buffer.settle();
    expect(flush).not.toHaveBeenCalled();
    expect(driver.process).not.toHaveBeenCalled();
  });

  it('AC-6: never rejects, even when a tracked callback rejects', async () => {
    const buffer = new InMemoryLogBuffer(new SpyDriver());
    buffer.track(Promise.reject(new Error('boom')));
    new LogService({ callback: () => Promise.reject(new Error('callback boom')) }, buffer).warn('x');
    await expect(buffer.settle()).resolves.toBeUndefined();
  });

  it('AC-6: resolves immediately when nothing is in flight', async () => {
    await expect(new InMemoryLogBuffer(new SpyDriver()).settle()).resolves.toBeUndefined();
  });

  it('AC-6 (redis): after logger.info + settle the list holds the entry and nothing went through the driver', async () => {
    const redis = fakeRedis();
    const driver = new SpyDriver();
    const buffer = new RedisLogBuffer(driver, redis as unknown as Redis);
    const flush = jest.spyOn(buffer, 'flush');
    const logger = new LogService({ service: 'api' }, buffer);
    logger.info('x');
    await buffer.settle();

    const stored = redis.lists.get('logs:pending') ?? [];
    expect(stored).toHaveLength(1);
    expect(JSON.parse(stored[0])).toMatchObject({ service: 'api', message: 'x', level: 'INFO' });
    expect(driver.process).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
    expect(redis.multi).not.toHaveBeenCalled();
  });

  it('AC-6 (redis): settle waits for a slow RPUSH', async () => {
    const redis = fakeRedis();
    const push = redis.rpush.getMockImplementation()!;
    redis.rpush.mockImplementation((k: string, v: string) => new Promise((r) => setTimeout(r, 20)).then(() => push(k, v)));
    const buffer = new RedisLogBuffer(new SpyDriver(), redis as unknown as Redis);
    new LogService({}, buffer).info('slow');
    expect(redis.lists.size).toBe(0);
    await buffer.settle();
    expect(redis.lists.get('logs:pending')).toHaveLength(1);
  });
});

describe('RedisLogBuffer lazy factory', () => {
  it('AC-8: a factory is not called by the constructor, is called once on first add, and is memoized', async () => {
    const redis = fakeRedis();
    const factory = jest.fn(() => redis as unknown as Redis);
    const buffer = new RedisLogBuffer(new SpyDriver(), factory);
    expect(factory).not.toHaveBeenCalled();

    new LogService({}, buffer).info('a');
    new LogService({}, buffer).info('b');
    await buffer.settle();
    await buffer.length();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(redis.rpush).toHaveBeenCalledTimes(2);
  });

  it('AC-8: the factory is also resolved on first length()', async () => {
    const redis = fakeRedis();
    const factory = jest.fn(() => redis as unknown as Redis);
    const buffer = new RedisLogBuffer(new SpyDriver(), factory);
    await buffer.length();
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('AC-8: a factory that throws costs no line: it is written through the driver', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const driver = new SpyDriver();
    const buffer = new RedisLogBuffer(driver, () => {
      throw new Error('no config');
    });
    expect(() => new LogService({}, buffer).info('kept')).not.toThrow();
    await buffer.settle();
    expect(driver.process).toHaveBeenCalledTimes(1);
  });
});
