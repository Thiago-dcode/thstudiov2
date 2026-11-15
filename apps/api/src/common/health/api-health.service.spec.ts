const mockLog = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), critical: jest.fn() };
const mockPing = jest.fn();
const mockQuery = jest.fn();
let lockClient: { ping: jest.Mock } | null;

jest.mock('@repo/backend-lib/services/log-service/factory', () => ({
  FactoryLogService: { createLogService: () => mockLog },
}));
jest.mock('@repo/database', () => ({ getClient: () => ({ query: mockQuery }) }));
jest.mock('../utils/cron-lock', () => ({ getLockClient: async () => lockClient }));

import { WorkerHost } from '@nestjs/bullmq';
import { LogService } from '@repo/backend-lib/services/log-service/base';
import { ApiHealthService, HEALTH_CHECK_TIMEOUT_MS } from './api-health.service';

class FakeHost extends WorkerHost {
  async process(): Promise<void> {
    return undefined;
  }
}

const makeHost = (name: string, running = true): WorkerHost => {
  const host = new FakeHost();
  Object.defineProperty(host, '_worker', {
    value: {
      name,
      isRunning: () => running,
      isPaused: () => false,
      backend: {
        client: Promise.resolve({ status: 'ready' }),
        blockingClient: Promise.resolve({ status: 'ready' }),
      },
    },
  });
  return host;
};

const makeService = (hosts: unknown[]) => {
  const discovery = { getProviders: () => hosts.map((instance) => ({ instance })) };
  const service = new ApiHealthService(discovery as never);
  service.onApplicationBootstrap();
  return service;
};

describe('ApiHealthService', () => {
  beforeEach(() => {
    Object.values(mockLog).forEach((fn) => fn.mockReset());
    mockPing.mockReset().mockResolvedValue('PONG');
    mockQuery.mockReset().mockResolvedValue({ rows: [] });
    lockClient = { ping: mockPing };
    jest.spyOn(LogService, 'flush').mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('AC-1: all probes pass -> healthy with every check ok and nothing logged', async () => {
    const service = makeService([makeHost('stripe-webhooks'), makeHost('plan-subscriptions'), {}, 'x']);
    await expect(service.check()).resolves.toEqual({
      healthy: true,
      checks: { redis: 'ok', database: 'ok', workers: 'ok' },
    });
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1');
    expect(mockLog.error).not.toHaveBeenCalled();
  });

  it('AC-2: discovers only WorkerHost instances, deduplicated by instance', () => {
    const a = makeHost('a');
    const service = makeService([a, a, { foo: 1 }, undefined, makeHost('b')]);
    expect(service.consumerHosts()).toHaveLength(2);
  });

  it('AC-2: a failing consumer gives workers fail, with detail only in the log', async () => {
    const service = makeService([makeHost('stripe-webhooks', false), makeHost('mail')]);
    const result = await service.check();

    expect(result.healthy).toBe(false);
    expect(result.checks).toEqual({ redis: 'ok', database: 'ok', workers: 'fail' });
    expect(JSON.stringify(result)).not.toContain('stripe-webhooks');
    expect(mockLog.error).toHaveBeenCalledTimes(1);
    const [, extra, opts] = mockLog.error.mock.calls[0];
    expect(JSON.stringify(extra)).toContain('stripe-webhooks');
    expect(opts).toMatchObject({ operation: 'health-check' });
    expect(LogService.flush).toHaveBeenCalled();
  });

  it('AC-2: no discovered consumers counts as failing', async () => {
    const service = makeService([]);
    expect((await service.check()).checks.workers).toBe('fail');
  });

  it('AC-3: redis is checked with PING on the lock client', async () => {
    const service = makeService([makeHost('mail')]);
    await service.check();
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it('AC-3/AC-4: redis ping rejection -> redis fail only', async () => {
    mockPing.mockRejectedValue(new Error('ECONNREFUSED secret-host'));
    const result = await makeService([makeHost('mail')]).check();
    expect(result.checks).toEqual({ redis: 'fail', database: 'ok', workers: 'ok' });
    expect(JSON.stringify(result)).not.toContain('secret-host');
  });

  it('AC-3: unavailable lock client -> redis fail', async () => {
    lockClient = null;
    const result = await makeService([makeHost('mail')]).check();
    expect(result.checks.redis).toBe('fail');
  });

  it('AC-3/AC-4: database query rejection -> database fail', async () => {
    mockQuery.mockRejectedValue(new Error('pool exhausted'));
    const result = await makeService([makeHost('mail')]).check();
    expect(result.checks).toEqual({ redis: 'ok', database: 'fail', workers: 'ok' });
    expect(result.healthy).toBe(false);
  });

  it('AC-3: a hung dependency fails at the 3 s timeout instead of hanging', async () => {
    jest.useFakeTimers();
    mockQuery.mockReturnValue(new Promise(() => undefined));
    mockPing.mockReturnValue(new Promise(() => undefined));
    const pending = makeService([makeHost('mail')]).check();
    await jest.advanceTimersByTimeAsync(HEALTH_CHECK_TIMEOUT_MS);
    const result = await pending;
    expect(HEALTH_CHECK_TIMEOUT_MS).toBe(3000);
    expect(result.checks).toEqual({ redis: 'fail', database: 'fail', workers: 'ok' });
  });

  it('AC-4: check never throws even if logging/flush fails', async () => {
    mockQuery.mockRejectedValue(new Error('x'));
    jest.spyOn(LogService, 'flush').mockRejectedValue(new Error('flush down'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(makeService([makeHost('mail')]).check()).resolves.toMatchObject({ healthy: false });
  });

  it('AC-9: pingRedis is true when Redis answers and false (not throwing) otherwise', async () => {
    const service = makeService([makeHost('mail')]);
    await expect(service.pingRedis()).resolves.toBe(true);
    mockPing.mockRejectedValue(new Error('down'));
    await expect(service.pingRedis()).resolves.toBe(false);
  });
});
