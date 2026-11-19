import { LogService } from '../../log.service';
import { InMemoryLogBuffer } from '../../buffers/in-memory-log.buffer';
import { LogDriver } from '../../drivers/log.driver';
import { LogEntry } from '../../types';
import { getLogProcessService, setLogProcessService } from '../process-service';

class MemoryDriver extends LogDriver {
  written: LogEntry[] = [];
  async process(entry: LogEntry): Promise<void> {
    this.written.push(entry);
  }
}

const serviceOf = async (config: ConstructorParameters<typeof LogService>[0]) => {
  const driver = new MemoryDriver();
  const buffer = new InMemoryLogBuffer(driver);
  new LogService(config, buffer).info('x');
  await buffer.flush();
  return driver.written[0].service;
};

// One file, one global: the order of these tests matters (set-once).
describe('log process service', () => {
  it('is null and lines fall back to unknown before an entrypoint sets it', async () => {
    expect(getLogProcessService()).toBeNull();
    expect(await serviceOf({})).toBe('unknown');
  });

  it('a logger with no service writes the process service; an explicit one still wins', async () => {
    setLogProcessService('worker');
    expect(await serviceOf({})).toBe('worker');
    expect(await serviceOf({ service: 'api' })).toBe('api');
  });

  it('is set once: a later call is ignored without throwing', () => {
    expect(() => setLogProcessService('web')).not.toThrow();
    expect(getLogProcessService()).toBe('worker');
  });

  it('a second copy of the module (another bundle) sees the same value', () => {
    let copy: unknown;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      copy = require('../../../../config/logging').getLogProcessService();
    });
    expect(copy).toBe('worker');
  });
});
