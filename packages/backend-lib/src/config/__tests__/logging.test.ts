const mockRedisCtor = jest.fn();
jest.mock('ioredis', () => ({
  __esModule: true,
  default: class FakeRedis {
    constructor(...args: unknown[]) {
      mockRedisCtor(...args);
    }
    rpush = jest.fn().mockResolvedValue(1);
    llen = jest.fn().mockResolvedValue(0);
    multi = () => {
      const tx = { lrange: () => tx, del: () => tx, exec: async () => [[null, []], [null, 0]] };
      return tx;
    };
  },
}));
const mockConfig = jest.fn(() => ({ redis: { url: 'redis://stub:6379' } }));
jest.mock('@repo/common-lib/config', () => ({ config: () => mockConfig() }));
jest.mock('../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn() }));

import { InMemoryLogBuffer } from '../../services/log-service/buffers/in-memory-log.buffer';
import { RedisLogBuffer } from '../../services/log-service/buffers/redis-log.buffer';
import { FileLogDriver } from '../../services/log-service/drivers/file-log.driver';
import * as logging from '../logging';

const LOG_BUFFER_KEY = Symbol.for('@repo/backend-lib/logBuffer');
const entry = { timestamp: 't', service: 'api', level: 'INFO', message: 'm', format: 'json' } as never;

describe('createProcessLogBuffer', () => {
  beforeEach(() => {
    mockRedisCtor.mockClear();
    mockConfig.mockClear();
  });

  it('AC-7: NODE_ENV=test gives an InMemoryLogBuffer and builds no Redis client', async () => {
    const buffer = logging.createProcessLogBuffer({ NODE_ENV: 'test' });
    expect(buffer).toBeInstanceOf(InMemoryLogBuffer);
    await buffer.length();
    expect(mockRedisCtor).not.toHaveBeenCalled();
  });

  it.each(['production', 'development', undefined])('AC-7: NODE_ENV=%s gives a RedisLogBuffer', (nodeEnv) => {
    const buffer = logging.createProcessLogBuffer({ NODE_ENV: nodeEnv } as NodeJS.ProcessEnv);
    expect(buffer).toBeInstanceOf(RedisLogBuffer);
  });

  it('AC-7: the Redis buffer is on logs:pending, over a FileLogDriver with no folder, and a lazyConnect client from config().redis.url', async () => {
    const buffer = logging.createProcessLogBuffer({ NODE_ENV: 'production' });
    const internals = buffer as unknown as { key: string; logDriver: FileLogDriver & Record<string, unknown> };
    expect(internals.key).toBe('logs:pending');
    expect(internals.logDriver).toBeInstanceOf(FileLogDriver);
    expect(Object.values(internals.logDriver).filter((v) => typeof v === 'string')).toEqual([]);

    await buffer.length();
    expect(mockRedisCtor).toHaveBeenCalledTimes(1);
    expect(mockRedisCtor).toHaveBeenCalledWith('redis://stub:6379', expect.objectContaining({ lazyConnect: true }));
  });

  it('AC-8: the client is built exactly once, with lazyConnect: true, on the first add / length / flush', async () => {
    for (const first of ['add', 'length', 'flush'] as const) {
      mockRedisCtor.mockClear();
      mockConfig.mockClear();
      const buffer = logging.createProcessLogBuffer({ NODE_ENV: 'production' });
      expect(mockRedisCtor).not.toHaveBeenCalled();
      expect(mockConfig).not.toHaveBeenCalled();
      if (first === 'add') buffer.add(entry);
      else if (first === 'length') await buffer.length();
      else await buffer.flush();
      await buffer.settle();
      await buffer.length();
      expect(mockRedisCtor).toHaveBeenCalledTimes(1);
      expect(mockRedisCtor).toHaveBeenCalledWith('redis://stub:6379', expect.objectContaining({ lazyConnect: true }));
      expect(mockConfig).toHaveBeenCalledTimes(1);
    }
  });
});

describe('process logBuffer singleton', () => {
  it('AC-2: logBuffer is exported (in memory under Jest) and the old storage export is not', () => {
    expect(logging.logBuffer).toBeInstanceOf(InMemoryLogBuffer);
    expect(('log' + 'Storage') in logging).toBe(false);
  });

  it('AC-2: two isolated loads of the module return the same instance', () => {
    let a: unknown;
    let b: unknown;
    jest.isolateModules(() => {
      a = require('../logging').logBuffer;
    });
    jest.isolateModules(() => {
      b = require('../logging').logBuffer;
    });
    expect(a).toBe(b);
    expect(a).toBe(logging.logBuffer);
    expect(a).toBe((globalThis as Record<symbol, unknown>)[LOG_BUFFER_KEY]);
  });

  it('AC-2: assigning to the global symbol throws TypeError', () => {
    expect(() => {
      (globalThis as Record<symbol, unknown>)[LOG_BUFFER_KEY] = {};
    }).toThrow(TypeError);
  });
});
