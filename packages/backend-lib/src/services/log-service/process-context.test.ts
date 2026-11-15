import os from 'node:os';
import { configureLogProcess, getCriticalHandler, getLogProcessContext } from './process-context';

describe('process context', () => {
  const originalEnv = process.env.LOG_SERVICE;
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalEnv === undefined) delete process.env.LOG_SERVICE;
    else process.env.LOG_SERVICE = originalEnv;
    configureLogProcess({ service: '', onCritical: null });
  });

  it('AC-6: configured service wins over LOG_SERVICE', () => {
    process.env.LOG_SERVICE = 'worker';
    configureLogProcess({ service: 'api' });
    expect(getLogProcessContext().service).toBe('api');
  });

  it('AC-6: falls back to LOG_SERVICE when nothing is configured', () => {
    process.env.LOG_SERVICE = 'dbcli';
    configureLogProcess({ service: '' });
    expect(getLogProcessContext().service).toBe('dbcli');
  });

  it('AC-6: falls back to unknown with neither', () => {
    delete process.env.LOG_SERVICE;
    configureLogProcess({ service: '' });
    expect(getLogProcessContext().service).toBe('unknown');
  });

  it.each([
    ['../etc', 'unknown'],
    ['..', 'unknown'],
    ['a/b', 'unknown'],
    ['a\\b', 'unknown'],
    ['/abs', 'unknown'],
    ['1api', 'unknown'],
    ['api service', 'unknown'],
    ['x'.repeat(40), 'unknown'],
    ['API', 'api'],
    ['  Worker ', 'worker'],
    ['x'.repeat(32), 'x'.repeat(32)],
  ])('AC-6: sanitises service %j to %j (never escapes the log root)', (input, expected) => {
    configureLogProcess({ service: input });
    expect(getLogProcessContext().service).toBe(expected);
  });

  it('AC-6: a hostile LOG_SERVICE env value is sanitised too', () => {
    process.env.LOG_SERVICE = '../etc';
    configureLogProcess({ service: '' });
    expect(getLogProcessContext().service).toBe('unknown');
  });

  it('AC-6: replica is os.hostname()', () => {
    jest.spyOn(os, 'hostname').mockReturnValue('abc123container');
    expect(getLogProcessContext().replica).toBe('abc123container');
  });

  it('AC-6: replica is truncated to 64 chars', () => {
    jest.spyOn(os, 'hostname').mockReturnValue('h'.repeat(100));
    expect(getLogProcessContext().replica).toHaveLength(64);
  });

  it('AC-6/AC-7: the critical handler is registered, replaced and cleared', () => {
    const handler = jest.fn();
    configureLogProcess({ service: 'api', onCritical: handler });
    expect(getCriticalHandler()).toBe(handler);
    configureLogProcess({ service: 'dbcli' });
    expect(getCriticalHandler()).toBeNull();
  });
});
