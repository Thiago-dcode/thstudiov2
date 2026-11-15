const logger = {
  name: jest.fn(),
  id: jest.fn(),
  info: jest.fn(),
  success: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  critical: jest.fn(),
  flushAsync: jest.fn(),
};
logger.name.mockReturnValue(logger);
logger.id.mockReturnValue(logger);
logger.flushAsync.mockResolvedValue(undefined);

const execFileMock = jest.fn();

jest.mock('../log-service/factory-log.service', () => ({
  FactoryLogService: { createLogService: jest.fn(() => logger) },
}));
jest.mock('../../utils/console', () => ({
  __esModule: true,
  default: { info: jest.fn(), success: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock('../../config/storage', () => ({ s3PrivateStorageConfig: () => ({}) }));
jest.mock('@repo/common-lib/config', () => ({
  config: () => ({
    app: { env: 'production', url: 'https://a11studio.com' },
    database: { database: 'db', host: 'h', port: 5432, username: 'u', password: 'SECRETDBPW' },
  }),
}));
jest.mock('node:child_process', () => ({ execFile: (...args: unknown[]) => execFileMock(...args) }));

import { backup } from './database-backup';

describe('database backup alerting', () => {
  beforeEach(() => {
    Object.values(logger).forEach((fn) => fn.mockClear());
    logger.name.mockReturnValue(logger);
    logger.id.mockReturnValue(logger);
    execFileMock.mockReset();
  });

  it('AC-26: a pg_dump failure logs critical (not error), rethrows and still flushes', async () => {
    execFileMock.mockImplementation((...args: unknown[]) => {
      const cb = args[args.length - 1] as (err: Error | null) => void;
      cb(new Error('pg_dump: connection refused'));
    });
    await expect(backup({} as any)).rejects.toThrow('pg_dump: connection refused');
    expect(logger.critical).toHaveBeenCalledTimes(1);
    const [message, options] = logger.critical.mock.calls[0];
    expect(message).toBe('Backup failed');
    expect(options.error.message).toBe('pg_dump: connection refused');
    expect(JSON.stringify(logger.critical.mock.calls[0])).not.toContain('SECRETDBPW');
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.flushAsync).toHaveBeenCalled();
  });

  it('AC-26: an upload failure also logs critical', async () => {
    execFileMock.mockImplementation((...args: unknown[]) => {
      const cb = args[args.length - 1] as (err: Error | null) => void;
      cb(null);
    });
    // The dump file is never created by the mock, so reading it fails the run.
    await expect(backup({ write: jest.fn(), head: jest.fn() } as any)).rejects.toBeDefined();
    expect(logger.critical).toHaveBeenCalledTimes(1);
    expect(logger.critical.mock.calls[0][0]).toBe('Backup failed');
  });
});
