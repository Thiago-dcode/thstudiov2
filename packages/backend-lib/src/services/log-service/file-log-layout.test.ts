import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { format } from 'date-fns';
import { FileLogService } from './file-log.service';
import { LogService } from './log.service';
import { configureLogProcess } from './process-context';
import { LogEntry } from './types';

const today = () => format(new Date(), 'yyyy-MM-dd');
const readFile = (file: string) =>
  fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const waitFor = async (check: () => boolean, ms = 2000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, 5));
  }
};

describe('FileLogService per-service layout', () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'layout-'));
    jest.spyOn(os, 'hostname').mockReturnValue('host-7');
    configureLogProcess({ service: 'api' });
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    configureLogProcess({ service: '', onCritical: null });
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it('AC-9: every channel and operation appends to <service>/<date>.log, nothing else', async () => {
    const a = new FileLogService({ logFolder: folder, channel: 'api.access', name: 'x' });
    const b = new FileLogService({ logFolder: folder, channel: 'media', name: 'create' });
    a.info('one');
    b.warn('two');
    await LogService.flush();
    expect(fs.readdirSync(folder)).toEqual(['api']);
    expect(fs.readdirSync(path.join(folder, 'api'))).toEqual([`${today()}.log`]);
    const lines = readFile(path.join(folder, 'api', `${today()}.log`));
    expect(lines.map((l) => l.channel).sort()).toEqual(['api.access', 'media']);
    expect(lines.map((l) => l.operation).sort()).toEqual(['create', 'x']);
  });

  it('AC-9: the folder follows the configured service (worker)', async () => {
    configureLogProcess({ service: 'worker' });
    new FileLogService({ logFolder: folder, channel: 'media' }).info('x');
    await LogService.flush();
    expect(fs.readdirSync(folder)).toEqual(['worker']);
  });

  it('AC-9: a hostile LOG_SERVICE cannot create a directory outside the log root', async () => {
    configureLogProcess({ service: '../escape' });
    new FileLogService({ logFolder: folder, channel: 'media' }).info('x');
    await LogService.flush();
    expect(fs.readdirSync(folder)).toEqual(['unknown']);
    expect(fs.existsSync(path.join(folder, '..', 'escape'))).toBe(false);
  });

  it('AC-9: the line carries service and replica, and the file is owner-only', async () => {
    new FileLogService({ logFolder: folder, channel: 'auth' }).info('x');
    await LogService.flush();
    const file = path.join(folder, 'api', `${today()}.log`);
    const [line] = readFile(file);
    expect(line.service).toBe('api');
    expect(line.replica).toBe('host-7');
    if (process.platform !== 'win32') expect(fs.statSync(file).mode & 0o777).toBe(0o600);
  });

  it('AC-2: timestamp is the call time, not the flush time', async () => {
    jest.useFakeTimers({
      now: new Date('2026-03-04T10:00:00.123Z'),
      doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'performance', 'hrtime'],
    });
    const logger = new FileLogService({ logFolder: folder, channel: 'auth' });
    logger.info('early');
    jest.setSystemTime(new Date('2026-03-04T10:00:05.123Z'));
    await LogService.flush();
    const [line] = readFile(path.join(folder, 'api', `${format(new Date('2026-03-04T10:00:00.123Z'), 'yyyy-MM-dd')}.log`));
    expect(line.timestamp).toBe('2026-03-04T10:00:00.123Z');
  });

  it('AC-2: the file date comes from the call instant, even if the flush happens after midnight', async () => {
    const call = new Date(2026, 2, 4, 23, 59, 59);
    jest.useFakeTimers({
      now: call,
      doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'performance', 'hrtime'],
    });
    new FileLogService({ logFolder: folder, channel: 'auth' }).info('late');
    jest.setSystemTime(new Date(2026, 2, 5, 0, 0, 3));
    await LogService.flush();
    expect(fs.readdirSync(path.join(folder, 'api'))).toEqual(['2026-03-04.log']);
  });

  it('AC-3: operation is snapshotted at schedule time', async () => {
    const logger = new FileLogService({ logFolder: folder, channel: 'ai' });
    logger.name('a').info('1');
    logger.name('b').info('2');
    logger.name('c');
    await LogService.flush();
    const lines = readFile(path.join(folder, 'api', `${today()}.log`));
    // Concurrent appends are not strictly ordered (plan: out-of-order lines are accepted).
    const byMessage = Object.fromEntries(lines.map((l) => [l.message, l.operation]));
    expect(byMessage).toEqual({ 1: 'a', 2: 'b' });
  });

  it('AC-8: service and replica are snapshotted at schedule time', async () => {
    const logger = new FileLogService({ logFolder: folder, channel: 'auth' });
    logger.info('before');
    configureLogProcess({ service: 'worker' });
    jest.spyOn(os, 'hostname').mockReturnValue('host-other');
    await LogService.flush();
    const [line] = readFile(path.join(folder, 'api', `${today()}.log`));
    expect(line.service).toBe('api');
    expect(line.replica).toBe('host-7');
    expect(fs.existsSync(path.join(folder, 'worker'))).toBe(false);
  });

  it('AC-8: channel is snapshotted too', async () => {
    const logger = new FileLogService({ logFolder: folder, channel: 'auth' });
    logger.info('1');
    logger.channel('media');
    await LogService.flush();
    expect(readFile(path.join(folder, 'api', `${today()}.log`))[0].channel).toBe('auth');
  });

  it('AC-10: 50 lines across channels on a fresh day produce exactly 50 parseable lines', async () => {
    const channels = ['auth', 'media', 'ai', 'api.access', 'mail'] as const;
    const loggers = channels.map((channel) => new FileLogService({ logFolder: folder, channel }));
    for (let i = 0; i < 50; i++) loggers[i % loggers.length].info(`line-${i}`, { i });
    await LogService.flush();
    const lines = readFile(path.join(folder, 'api', `${today()}.log`));
    expect(lines).toHaveLength(50);
    expect(new Set(lines.map((l) => l.message)).size).toBe(50);
  });

  it('AC-10: only appendFile is used, never writeFile', async () => {
    const writeSpy = jest.spyOn(fsp, 'writeFile');
    const logger = new FileLogService({ logFolder: folder, channel: 'auth' });
    logger.info('a');
    await LogService.flush();
    logger.info('b');
    await LogService.flush();
    expect(writeSpy).not.toHaveBeenCalled();
    expect(readFile(path.join(folder, 'api', `${today()}.log`)).map((l) => l.message)).toEqual(['a', 'b']);
  });

  it('AC-10: recreates a service dir that retention removed (ENOENT retry)', async () => {
    const logger = new FileLogService({ logFolder: folder, channel: 'auth' });
    logger.info('first');
    await LogService.flush();
    fs.rmSync(path.join(folder, 'api'), { recursive: true, force: true });
    logger.info('second');
    await LogService.flush();
    expect(readFile(path.join(folder, 'api', `${today()}.log`)).map((l) => l.message)).toEqual(['second']);
  });

  it('AC-16: critical flushes immediately, without an explicit flush()', async () => {
    new FileLogService({ logFolder: folder, channel: 'api.error' }).critical('now', undefined, { status_code: 503 });
    const file = path.join(folder, 'api', `${today()}.log`);
    await waitFor(() => fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('now'));
    const [line] = readFile(file);
    expect(line.level).toBe('CRITICAL');
    expect(line.status_code).toBe(503);
  });

  it('AC-16: a non-critical line waits for the flush', async () => {
    new FileLogService({ logFolder: folder, channel: 'api.error' }).error('later');
    await new Promise((r) => setTimeout(r, 50));
    expect(fs.existsSync(path.join(folder, 'api'))).toBe(false);
    await LogService.flush();
    expect(fs.existsSync(path.join(folder, 'api', `${today()}.log`))).toBe(true);
  });

  it('AC-17: the handler runs after the append, once, with the written entry', async () => {
    const file = path.join(folder, 'api', `${today()}.log`);
    let existedAtDispatch = false;
    const handler = jest.fn(async (_entry: LogEntry) => {
      existedAtDispatch = fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('boom');
    });
    configureLogProcess({ service: 'api', onCritical: handler });
    new FileLogService({ logFolder: folder, channel: 'api.error', name: 'op' }).critical('boom', { password: 'SECRETPW' });
    await waitFor(() => handler.mock.calls.length === 1);
    expect(existedAtDispatch).toBe(true);
    const entry = handler.mock.calls[0][0];
    expect(entry).toMatchObject({ service: 'api', channel: 'api.error', operation: 'op', level: 'CRITICAL', message: 'boom' });
    expect(JSON.stringify(entry)).not.toContain('SECRETPW');
    await LogService.flush();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('AC-17: the handler is still called when appendFile rejects (full disk)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(fsp, 'appendFile').mockRejectedValue(Object.assign(new Error('ENOSPC'), { code: 'ENOSPC' }));
    const handler = jest.fn().mockResolvedValue(undefined);
    configureLogProcess({ service: 'api', onCritical: handler });
    new FileLogService({ logFolder: folder, channel: 'api.error' }).critical('disk full');
    await waitFor(() => handler.mock.calls.length === 1);
    expect(handler.mock.calls[0][0]).toMatchObject({ message: 'disk full', level: 'CRITICAL' });
  });

  it('AC-17: other levels never dispatch, also through the file driver', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    configureLogProcess({ service: 'api', onCritical: handler });
    const logger = new FileLogService({ logFolder: folder, channel: 'api.error' });
    logger.info('a').warn('b').error('c').debug('d').success('e');
    await LogService.flush();
    expect(handler).not.toHaveBeenCalled();
  });

  it('AC-18: a rejecting handler never rejects flush() or the caller', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    configureLogProcess({ service: 'api', onCritical: jest.fn().mockRejectedValue(new Error('mail down')) });
    const logger = new FileLogService({ logFolder: folder, channel: 'api.error' });
    expect(() => logger.critical('x')).not.toThrow();
    await waitFor(() => err.mock.calls.some((c) => String(c[0]).includes('critical handler failed')));
    await expect(LogService.flush()).resolves.toBeUndefined();
    const lines = readFile(path.join(folder, 'api', `${today()}.log`));
    // No recursion: exactly the one critical line, no extra log line about the failure.
    expect(lines).toHaveLength(1);
  });
});
