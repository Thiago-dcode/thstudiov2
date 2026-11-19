// AC-8: a production process imports config/logging (the web app does too). Set before any import.
process.env.NODE_ENV = 'production';

const mockRedisCtor = jest.fn();
jest.mock('ioredis', () => ({
  __esModule: true,
  default: class FakeRedis {
    constructor(...args: unknown[]) {
      mockRedisCtor(...args);
    }
    llen = jest.fn().mockResolvedValue(0);
  },
}));
const mockConfig = jest.fn(() => ({ redis: { url: 'redis://stub:6379' } }));
jest.mock('@repo/common-lib/config', () => ({ config: () => mockConfig() }));
jest.mock('../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn() }));
const mockFsTouch = jest.fn();
jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return new Proxy(actual, {
    get(target, prop) {
      if (['existsSync', 'mkdirSync', 'readFileSync', 'appendFileSync', 'writeFileSync'].includes(String(prop))) {
        return (...args: unknown[]) => {
          mockFsTouch(prop, ...args);
          return target[prop](...args);
        };
      }
      return target[prop];
    },
  });
});

describe('AC-8: importing config/logging in production', () => {
  it('AC-8: opens no connection, calls neither config() nor fs; the first use builds one lazyConnect client', async () => {
    const started = mockFsTouch.mock.calls.length;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { logBuffer } = require('../logging') as typeof import('../logging');
    const { RedisLogBuffer } = require('../../services/log-service/buffers/redis-log.buffer');

    expect(logBuffer).toBeInstanceOf(RedisLogBuffer);
    expect(mockRedisCtor).not.toHaveBeenCalled();
    expect(mockConfig).not.toHaveBeenCalled();
    expect(mockFsTouch.mock.calls.length).toBe(started);

    await logBuffer.length();
    expect(mockRedisCtor).toHaveBeenCalledTimes(1);
    expect(mockRedisCtor).toHaveBeenCalledWith('redis://stub:6379', expect.objectContaining({ lazyConnect: true }));
  });
});
