jest.mock('../../utils/critical-alert-mail', () => ({ criticalAlertMail: jest.fn().mockResolvedValue(undefined) }));

import { LogService } from '../../services/log-service/log.service';
import { InMemoryLogBuffer } from '../../services/log-service/buffers/in-memory-log.buffer';
import { LogDriver } from '../../services/log-service/drivers/log.driver';
import { LogContext, LogEntryBase } from '../../services/log-service/types';
import { logBuffer, logService } from '../logging';
import { getLogProcessService, setLogProcessService } from '../log-process-service';

class MemoryDriver extends LogDriver<LogEntryBase> {
  written: LogEntryBase[] = [];
  async process(_logContext: LogContext, entry: LogEntryBase): Promise<void> {
    this.written.push(entry);
  }
}

/** A bare LogService (no project layer) with this config: the service it writes. */
const bareServiceOf = async (config: ConstructorParameters<typeof LogService>[0]) => {
  const driver = new MemoryDriver();
  const buffer = new InMemoryLogBuffer(driver);
  new LogService(config, buffer).info('x');
  await buffer.flush();
  return driver.written[0].service;
};

/** The service the project's `logService.lib` / `logService.api` write, read from the line's context. */
const serviceOfFactory = async (build: () => { info(message: string): unknown }) => {
  const seen: LogContext[] = [];
  const spy = jest.spyOn(logBuffer, 'add').mockImplementation((logContext) => void seen.push(logContext));
  build().info('x');
  spy.mockRestore();
  return seen[0].service;
};

// One file, one global: the order of these tests matters (set-once).
describe('log process service', () => {
  it('is null and lines fall back to unknown before an entrypoint sets it', async () => {
    expect(getLogProcessService()).toBeNull();
    expect(await bareServiceOf({})).toBe('unknown');
    expect(await serviceOfFactory(() => logService.lib())).toBe('unknown');
  });

  it('logService.lib writes the process service, also for a logger built before it was set; an explicit service still wins', async () => {
    const early = logService.lib();
    setLogProcessService('worker');
    expect(await serviceOfFactory(() => early)).toBe('worker');
    expect(await serviceOfFactory(() => logService.lib())).toBe('worker');
    expect(await serviceOfFactory(() => logService.api())).toBe('api');
    expect(await bareServiceOf({ service: 'api' })).toBe('api');
  });

  it('a bare LogService never reads the process service: it is a project concept', async () => {
    expect(getLogProcessService()).toBe('worker');
    expect(await bareServiceOf({})).toBe('unknown');
  });

  it('is set once: a later call is ignored without throwing', () => {
    expect(() => setLogProcessService('web')).not.toThrow();
    expect(getLogProcessService()).toBe('worker');
  });

  it('a second copy of the module (another bundle) sees the same value', () => {
    let copy: unknown;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      copy = require('../logging').getLogProcessService();
    });
    expect(copy).toBe('worker');
  });
});
