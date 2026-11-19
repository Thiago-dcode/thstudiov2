const order: string[] = [];
const mockWorkers: any[] = [];
const mockWorkerCtor = jest.fn();

jest.mock('bullmq', () => ({
  Worker: class {
    on = jest.fn();
    isRunning = () => true;
    backend = { client: Promise.resolve({ status: 'ready', get: jest.fn() }) };
    close = jest.fn(async () => {
      order.push('worker.close');
    });
    constructor(...args: unknown[]) {
      mockWorkerCtor(...args);
      mockWorkers.push(this);
    }
  },
  Queue: class {},
}));
jest.mock('express', () => () => ({
  get: jest.fn(),
  listen: jest.fn(() => ({ close: jest.fn(() => order.push('server.close')) })),
}));
jest.mock('@repo/database', () => ({
  init: jest.fn().mockResolvedValue(undefined),
  getClient: jest.fn(),
  killClient: jest.fn(async () => {
    order.push('killClient');
  }),
}));
jest.mock('@repo/common-lib/config', () => ({
  config: () => ({ redis: { url: 'redis://localhost:6379' }, database: {}, backup: { cron: '0 0 * * *' } }),
}));
const mockScheduleLogFlush = jest.fn(async () => {
  order.push('scheduleLogFlush');
});
const mockScheduleBackup = jest.fn(async () => {
  order.push('scheduleDatabaseBackup');
});
jest.mock('./schedulers', () => ({
  withQueue: jest.fn(async () => undefined),
  scheduleDatabaseBackup: () => mockScheduleBackup(),
  scheduleLogFlush: () => mockScheduleLogFlush(),
}));
jest.mock('./job-runner', () => ({
  jobResolver: { 'media-queue': {}, log: {} },
  runWorkerJob: jest.fn(),
}));

import { logBuffer } from '@repo/backend-lib/config/logging';

describe('worker main', () => {
  let handlers: Record<string, () => Promise<void>>;
  let settle: jest.SpyInstance;
  let flush: jest.SpyInstance;
  let exit: jest.SpyInstance;
  let startup: { backup: number; logFlush: number; queues: unknown[]; order: string[] };

  beforeAll(async () => {
    handlers = {};
    jest.spyOn(process, 'on').mockImplementation(((event: string, fn: () => Promise<void>) => {
      handlers[event] = fn;
      return process;
    }) as never);
    settle = jest.spyOn(logBuffer, 'settle').mockImplementation(async () => {
      order.push('settle');
    });
    flush = jest.spyOn(logBuffer, 'flush');
    exit = jest.spyOn(process, 'exit').mockImplementation((() => {
      order.push('exit');
    }) as never);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    require('./main');
    // bootstrap() is fire-and-forget; wait until it registered the handlers
    for (let i = 0; i < 50 && !handlers.SIGTERM; i++) await new Promise((r) => setTimeout(r, 10));
    // the jest config resets mocks between tests, so record what bootstrap did now
    startup = {
      backup: mockScheduleBackup.mock.calls.length,
      logFlush: mockScheduleLogFlush.mock.calls.length,
      queues: mockWorkerCtor.mock.calls.map((c) => c[0]),
      order: [...order],
    };
  });

  it('AC-10: bootstrap awaits scheduleLogFlush next to scheduleDatabaseBackup, before creating workers', () => {
    expect(startup.backup).toBe(1);
    expect(startup.logFlush).toBe(1);
    expect(startup.order.indexOf('scheduleLogFlush')).toBeGreaterThan(startup.order.indexOf('scheduleDatabaseBackup'));
    expect(startup.queues.length).toBeGreaterThan(0);
  });

  it('AC-11: a Worker is created for every queue in jobResolver, LOG_QUEUE included', () => {
    expect(startup.queues).toEqual(['media-queue', 'log']);
  });

  it('AC-13: SIGTERM closes the workers, then settles the buffer, then exits; it never flushes', async () => {
    order.length = 0;
    expect(handlers.SIGTERM).toBeDefined();
    expect(handlers.SIGINT).toBeDefined();
    await handlers.SIGTERM();
    expect(order.indexOf('worker.close')).toBeGreaterThan(-1);
    expect(order.indexOf('settle')).toBeGreaterThan(order.lastIndexOf('worker.close'));
    expect(order.indexOf('exit')).toBeGreaterThan(order.indexOf('settle'));
    expect(settle).toHaveBeenCalledTimes(1);
    expect(flush).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('AC-13: a settle that never resolves is bounded (5 s timeout) and the worker still exits', async () => {
    order.length = 0;
    jest.useFakeTimers();
    settle.mockImplementation(() => new Promise<void>(() => undefined));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const done = handlers.SIGINT();
    await jest.advanceTimersByTimeAsync(5100);
    await done;
    jest.useRealTimers();
    expect(order).toContain('exit');
    expect(flush).not.toHaveBeenCalled();
  });
});
