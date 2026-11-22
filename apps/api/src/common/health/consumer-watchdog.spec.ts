const mockLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
const mockSet = jest.fn();
let lockClient: { set: jest.Mock } | null;
let appConfig: { env: string; url: string };

jest.mock('@repo/backend-lib/config/logging', () => {
  // Patch the real factories so backend-lib's internal loggers see the mock too.
  const actual = jest.requireActual('@repo/backend-lib/config/logging');
  const create = () => mockLog;
  const factory = (service: string | null) => (overrides: Record<string, unknown> = {}) =>
    (create as (buffer: unknown, cfg: any) => unknown)(undefined, { service, ...overrides });
  // backend-lib's own import cycle (config/logging -> critical-alert-mail -> job-trace) re-enters
  // this factory before the module has finished loading; patch once `logService` exists.
  if (actual.logService) {
    Object.assign(actual.logService, {
      api: factory('api'), worker: factory('worker'), dbcli: factory('dbcli'), web: factory('web'), lib: factory(null),
    });
  }
  return actual;
});
jest.mock('@repo/common-lib/config/utils', () => ({ getConfigValue: () => appConfig }));
jest.mock('../utils/cron-lock', () => ({ getLockClient: async () => lockClient }));

import { logBuffer } from '@repo/backend-lib/config/logging';
import {
  ConsumerWatchdog,
  WATCHDOG_BOOT_GRACE_MS,
  WATCHDOG_FAILURES_BEFORE_RESTART,
  WATCHDOG_RESTART_LOCK_KEY,
  WATCHDOG_RESTART_LOCK_TTL_MS,
} from './consumer-watchdog';

let clock = 0;
const order: string[] = [];
const exitMock = jest.fn();

class TestWatchdog extends ConsumerWatchdog {
  protected now() {
    return clock;
  }
  protected async settleLogs() {
    order.push('settle');
  }
  protected exit(code: number) {
    order.push('exit');
    exitMock(code);
  }
}

type Health = {
  checkConsumers: jest.Mock;
  pingRedis: jest.Mock;
  consumerHosts: jest.Mock;
};

const failingStatus = [{ queue: 'stripe-webhooks', ok: false, reason: 'worker is not running' }];

const setup = () => {
  const closeHealthy = jest.fn(async () => {
    order.push('close');
  });
  const closeBroken = jest.fn();
  const host = (name: string, close: jest.Mock) => ({ worker: { name, close } });
  const health: Health = {
    checkConsumers: jest.fn(async () => failingStatus),
    pingRedis: jest.fn(async () => true),
    consumerHosts: jest.fn(() => [host('stripe-webhooks', closeBroken), host('mail', closeHealthy)]),
  };
  const watchdog = new TestWatchdog(health as never);
  watchdog.onApplicationBootstrap();
  clock = WATCHDOG_BOOT_GRACE_MS + 1; // past the grace period
  return { watchdog, health, closeHealthy, closeBroken };
};

const ticks = async (watchdog: ConsumerWatchdog, n: number) => {
  for (let i = 0; i < n; i++) await watchdog.tick();
};

describe('ConsumerWatchdog', () => {
  beforeEach(() => {
    clock = 0;
    order.length = 0;
    exitMock.mockReset();
    Object.values(mockLog).forEach((fn) => fn.mockReset());
    mockSet.mockReset().mockResolvedValue('OK');
    lockClient = { set: mockSet };
    appConfig = { env: 'production', url: 'https://dev.a11studio.com' };
    jest.spyOn(logBuffer, 'flush').mockImplementation(async () => {
      order.push('flush');
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('AC-8: ticks inside the 60 s boot grace do nothing', async () => {
    const { watchdog, health } = setup();
    clock = WATCHDOG_BOOT_GRACE_MS - 1;
    await ticks(watchdog, 10);
    expect(health.checkConsumers).not.toHaveBeenCalled();
    expect(exitMock).not.toHaveBeenCalled();
    expect(WATCHDOG_BOOT_GRACE_MS).toBe(60_000);
  });

  it('AC-10: 3 failing ticks do not exit; the 4th logs critical and exits', async () => {
    const { watchdog } = setup();
    expect(WATCHDOG_FAILURES_BEFORE_RESTART).toBe(4);
    await ticks(watchdog, 3);
    expect(exitMock).not.toHaveBeenCalled();
    expect(mockLog.critical).not.toHaveBeenCalled();

    await watchdog.tick();
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);

    const [message, extra] = mockLog.critical.mock.calls[0];
    expect(message).toMatch(/^API replica restarting: queue consumer down \(dev\.a11studio\.com/);
    expect(JSON.stringify(extra)).toContain('stripe-webhooks');
    expect(JSON.stringify(extra)).toContain('worker is not running');
    expect(extra).toMatchObject({ operation: 'consumer-watchdog' });
  });

  it('AC-10: takes SET api-watchdog:restart NX PX 120000 before restarting', async () => {
    const { watchdog } = setup();
    await ticks(watchdog, 4);
    expect(mockSet).toHaveBeenCalledTimes(1);
    const [key, , opts] = mockSet.mock.calls[0];
    expect(key).toBe(WATCHDOG_RESTART_LOCK_KEY);
    expect(key).toBe('api-watchdog:restart');
    expect(opts).toEqual({ condition: 'NX', expiration: { type: 'PX', value: 120000 } });
    expect(WATCHDOG_RESTART_LOCK_TTL_MS).toBe(120000);
  });

  it('AC-10: lock not acquired -> no critical, no exit, retried on the next tick', async () => {
    const { watchdog } = setup();
    mockSet.mockResolvedValue(null);
    await ticks(watchdog, 5);
    expect(exitMock).not.toHaveBeenCalled();
    expect(mockLog.critical).not.toHaveBeenCalled();

    mockSet.mockResolvedValue('OK');
    await watchdog.tick();
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('AC-10: unavailable lock client -> does not exit', async () => {
    const { watchdog } = setup();
    lockClient = null;
    await ticks(watchdog, 5);
    expect(exitMock).not.toHaveBeenCalled();
  });

  it('AC-10: closes the healthy workers, then settles (never flushes) the logs, and exits last', async () => {
    const { watchdog } = setup();
    await ticks(watchdog, 4);
    expect(order).not.toContain('flush');
    expect(order.indexOf('close')).toBeLessThan(order.indexOf('settle'));
    expect(order.indexOf('settle')).toBeLessThan(order.indexOf('exit'));
    expect(order[order.length - 1]).toBe('exit');
  });

  it('AC-10: closes healthy workers only, never the broken one', async () => {
    const { watchdog, closeHealthy, closeBroken } = setup();
    await ticks(watchdog, 4);
    expect(closeHealthy).toHaveBeenCalledTimes(1);
    expect(closeBroken).not.toHaveBeenCalled();
  });

  it('AC-10: still exits when closing workers hangs past 10 s', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    try {
      const { watchdog, health } = setup();
      health.consumerHosts.mockReturnValue([{ worker: { name: 'mail', close: () => new Promise(() => undefined) } }]);
      const run = ticks(watchdog, 4);
      await jest.advanceTimersByTimeAsync(10_000);
      await run;
      expect(exitMock).toHaveBeenCalledWith(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('AC-9: a tick where Redis is down does not count and resets the count', async () => {
    const { watchdog, health } = setup();
    await ticks(watchdog, 3);
    health.pingRedis.mockResolvedValueOnce(false);
    await watchdog.tick(); // redis down: reset
    await ticks(watchdog, 3);
    expect(exitMock).not.toHaveBeenCalled();
    await watchdog.tick();
    expect(exitMock).toHaveBeenCalled();
  });

  it('AC-9: Redis down for many ticks never restarts', async () => {
    const { watchdog, health } = setup();
    health.pingRedis.mockResolvedValue(false);
    await ticks(watchdog, 20);
    expect(exitMock).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('AC-9: a passing tick resets the count', async () => {
    const { watchdog, health } = setup();
    await ticks(watchdog, 3);
    health.checkConsumers.mockResolvedValueOnce([]);
    await watchdog.tick();
    await ticks(watchdog, 3);
    expect(exitMock).not.toHaveBeenCalled();
    await watchdog.tick();
    expect(exitMock).toHaveBeenCalled();
  });

  it('AC-11: local env logs critical but never exits or takes the lock', async () => {
    appConfig = { env: 'local', url: 'http://localhost:3000' };
    const { watchdog } = setup();
    await ticks(watchdog, 8);
    expect(mockLog.critical).toHaveBeenCalled();
    expect(exitMock).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('AC-12: an error inside a tick is logged at error, swallowed, and counts as passing', async () => {
    const { watchdog, health } = setup();
    await ticks(watchdog, 3);
    health.checkConsumers.mockRejectedValueOnce(new Error('boom'));
    await expect(watchdog.tick()).resolves.toBeUndefined();
    expect(mockLog.error).toHaveBeenCalledWith(
      'Consumer watchdog tick failed',
      expect.objectContaining({ error_message: 'boom', operation: 'consumer-watchdog' }),
    );
    await ticks(watchdog, 3); // count was reset by the error tick
    expect(exitMock).not.toHaveBeenCalled();
  });

  it('AC-12: a throwing logger does not escape the tick', async () => {
    const { watchdog } = setup();
    mockLog.error.mockImplementationOnce(() => { throw new Error('log down'); });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(watchdog.tick()).resolves.toBeUndefined();
  });

  it('AC-10: the real settleLogs waits on logBuffer.settle() and never flushes', async () => {
    const settle = jest.spyOn(logBuffer, 'settle').mockResolvedValue(undefined);
    const flush = jest.spyOn(logBuffer, 'flush');
    const watchdog = new ConsumerWatchdog({} as never);
    await (watchdog as unknown as { settleLogs(): Promise<void> }).settleLogs();
    expect(settle).toHaveBeenCalledTimes(1);
    expect(flush).not.toHaveBeenCalled();
  });

  it('AC-10: no consumers discovered -> one critical, never counted, never exits', async () => {
    const { watchdog, health } = setup();
    health.consumerHosts.mockReturnValue([]);
    health.checkConsumers.mockResolvedValue([{ queue: '*', ok: false, reason: 'no BullMQ consumers discovered' }]);
    await ticks(watchdog, 12);
    expect(mockLog.critical).toHaveBeenCalledTimes(1);
    expect(mockLog.critical.mock.calls[0][0]).toMatch(/^API replica has no queue consumers/);
    expect(exitMock).not.toHaveBeenCalled();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('AC-10: after deciding to restart, later ticks do nothing more', async () => {
    const { watchdog, health } = setup();
    await ticks(watchdog, 4);
    health.checkConsumers.mockClear();
    await ticks(watchdog, 2);
    expect(health.checkConsumers).not.toHaveBeenCalled();
  });
});
