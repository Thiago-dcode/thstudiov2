import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { format } from 'date-fns';
import os from 'node:os';
import path from 'node:path';
import { LogService } from '../log.service';
import { InMemoryLogBuffer } from '../buffers/in-memory-log.buffer';
import { FileLogDriver } from '../drivers/file-log.driver';
import { LogConfig, LogEntryBase } from '../types';
import { RequestLogContext } from '@repo/common-lib/types/request';

/** A buffer writing into `folder`, as config/logging.ts builds the process one. */
const fileBuffer = (folder: string) => new InMemoryLogBuffer(new FileLogDriver<LogEntryBase>(folder));
/** The generic LogService over the default entry builder: the line is the entry, `globalContext` included. */
const fileLogger = (config: LogConfig<RequestLogContext>, buffer: InMemoryLogBuffer<LogEntryBase>) =>
  new LogService<RequestLogContext, LogEntryBase>(config, buffer);
let buffer: InMemoryLogBuffer<LogEntryBase>;

const ctx = (id: string): RequestLogContext => ({
  id,
  method: 'GET',
  path: `/p/${id}`,
  ip_address: null,
  user_agent: null,
  user_id: null,
  user_role: null,
  language: null,
  unattributed_app_call: false,
});

// Every line of a process goes to `<folder>/<service>/<date>.log`, whatever its options.
const readLines = (folder: string, service = 'unknown') => {
  const dir = path.join(folder, service);
  return fs.readdirSync(dir).flatMap((f) =>
    fs
      .readFileSync(path.join(dir, f), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l)),
  );
};

describe('FileLogDriver deferred globalContext snapshot', () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'filelog-'));
    buffer = fileBuffer(folder);
  });
  afterEach(() => {
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it('AC-10: writes context A after the live context switches to B', async () => {
    let current: RequestLogContext | undefined = ctx('A');
    let id: string | null = 'A';
    const logger = fileLogger({ id: () => id, globalContext: () => current }, buffer);
    logger.info('first');
    current = ctx('B');
    id = 'B';
    await buffer.flush();
    const [line] = readLines(folder);
    expect(line.globalContext.id).toBe('A');
    expect(line.id).toBe('A');
  });

  it('AC-10: writes context A after the live context becomes undefined', async () => {
    let current: RequestLogContext | undefined = ctx('A');
    const logger = fileLogger({ globalContext: () => current }, buffer);
    logger.warn('first');
    current = undefined;
    await buffer.flush();
    const [line] = readLines(folder);
    expect(line.globalContext).toEqual(ctx('A'));
  });

  it('AC-10: an absent snapshot stays absent even if the live value later becomes a context', async () => {
    let current: RequestLogContext | undefined;
    const logger = fileLogger({ globalContext: () => current }, buffer);
    logger.info('first');
    current = ctx('late');
    await buffer.flush();
    const [line] = readLines(folder);
    expect('globalContext' in line).toBe(false);
  });

  it('AC-10: interleaved lines each keep their own context', async () => {
    let current: RequestLogContext | undefined;
    const logger = fileLogger({ globalContext: () => current }, buffer);
    current = ctx('A');
    logger.info('a');
    current = ctx('B');
    logger.info('b');
    current = ctx('C');
    await buffer.flush();
    const lines = readLines(folder);
    expect(lines.map((l) => l.message).sort()).toEqual(['a', 'b']);
    for (const l of lines) expect(l.globalContext.id).toBe(l.message.toUpperCase());
  });

  it('writes with appendFile only: an existing file is never truncated and writeFile is not used', async () => {
    const writeSpy = jest.spyOn(fsp, 'writeFile');
    const logger = fileLogger({}, buffer);
    logger.info('one');
    await buffer.flush();
    logger.info('two');
    await buffer.flush();
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
    expect(readLines(folder).map((l) => l.message)).toEqual(['one', 'two']);
  });

  it('keeps pre-existing file content and creates new files owner-only', async () => {
    const dir = path.join(folder, 'unknown');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, format(new Date(), 'yyyy-MM-dd') + '.log');
    fs.writeFileSync(file, JSON.stringify({ message: 'old' }) + '\n');
    const logger = fileLogger({}, buffer);
    logger.info('new');
    await buffer.flush();
    expect(readLines(folder).map((l) => l.message)).toEqual(['old', 'new']);
    const freshFolder = path.join(folder, 'fresh-root');
    const freshBuffer = fileBuffer(freshFolder);
    fileLogger({}, freshBuffer).info('x');
    await freshBuffer.flush();
    const freshDir = path.join(freshFolder, 'unknown');
    const f = path.join(freshDir, fs.readdirSync(freshDir)[0]);
    if (process.platform !== 'win32') expect(fs.statSync(f).mode & 0o777).toBe(0o600);
  });

  it('AC-7: a logger with no globalContext config writes no globalContext key', async () => {
    const logger = fileLogger({}, buffer);
    logger.info('x');
    await buffer.flush();
    const [line] = readLines(folder);
    expect('globalContext' in line).toBe(false);
    expect(line.message).toBe('x');
  });
});

describe('FileLogDriver service folder', () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'filelog-svc-'));
    buffer = fileBuffer(folder);
  });
  afterEach(() => {
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it('AC-3: writes each line under <folder>/<the service read on that line>/', async () => {
    let current = 'unknown';
    const logger = fileLogger({ service: () => current }, buffer);
    logger.info('first');
    current = 'worker';
    logger.info('second');
    current = 'web';
    await buffer.flush();
    expect(readLines(folder, 'unknown').map((l) => l.message)).toEqual(['first']);
    expect(readLines(folder, 'worker').map((l) => l.message)).toEqual(['second']);
    expect(fs.existsSync(path.join(folder, 'web'))).toBe(false);
  });

  it('a fixed service writes under its own folder', async () => {
    fileLogger({ service: 'api' }, buffer).info('x');
    await buffer.flush();
    expect(readLines(folder, 'api').map((l) => l.message)).toEqual(['x']);
    expect(fs.existsSync(path.join(folder, 'unknown'))).toBe(false);
  });
});

describe('FileLogDriver callback', () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'filelog-cb-'));
    buffer = fileBuffer(folder);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it('calls the callback when the line is logged, before any flush; the write waits for the flush', async () => {
    const callback = jest.fn().mockResolvedValue(undefined);
    fileLogger({ service: 'worker', callback }, buffer).info('x');
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ service: 'worker', message: 'x' }), undefined);
    expect(fs.existsSync(path.join(folder, 'worker'))).toBe(false);
    await buffer.flush();
    expect(fs.readdirSync(path.join(folder, 'worker'))).toHaveLength(1);
  });

  it('flush never waits for a slow callback; settle does', async () => {
    let release!: () => void;
    let done = false;
    const callback = jest.fn(() => new Promise<void>((resolve) => { release = resolve; }).then(() => { done = true; }));
    fileLogger({ service: 'api', callback }, buffer).critical('boom');
    await buffer.flush();
    expect(fs.readdirSync(path.join(folder, 'api'))).toHaveLength(1);
    expect(done).toBe(false);
    const settled = buffer.settle();
    release();
    await settled;
    expect(done).toBe(true);
  });

  it('the callback runs even when the write fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(fsp, 'appendFile').mockRejectedValue(new Error('disk full'));
    const callback = jest.fn().mockResolvedValue(undefined);
    fileLogger({ service: 'api', callback }, buffer).critical('boom');
    await buffer.flush();
    await buffer.settle();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ level: 'critical' }), undefined);
  });
});

describe('FileLogDriver failing id/globalContext', () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'filelog-fail-'));
    buffer = fileBuffer(folder);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it('a throwing id/globalContext gives nothing, still writes the line and runs the callback', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const callback = jest.fn().mockResolvedValue(undefined);
    const logger = fileLogger({
      service: 'api',
      callback,
      id: () => { throw new Error('sync boom'); },
      globalContext: () => { throw new Error('boom'); },
    }, buffer);
    logger.critical('still here');
    await buffer.flush();
    await buffer.settle();
    const lines = readLines(folder, 'api');
    expect(lines).toEqual([expect.objectContaining({ message: 'still here', id: null })]);
    expect('globalContext' in lines[0]).toBe(false);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ level: 'critical' }), undefined);
  });
});
