import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { format } from 'date-fns';
import os from 'node:os';
import path from 'node:path';
import { LogService } from '../log.service';
import { InMemoryLogBuffer } from '../buffers/in-memory-log.buffer';
import { FileLogDriver } from '../drivers/file-log.driver';
import { RequestLogContext } from '@repo/common-lib/types/request';

/** A buffer writing into `folder`, as config/logging.ts builds the process one. */
const fileBuffer = (folder: string) => new InMemoryLogBuffer(new FileLogDriver(folder));
let buffer: InMemoryLogBuffer;

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

// Every line of a process goes to `<folder>/<service>/<date>.log`, whatever the channel.
const readLines = (folder: string) => {
  const dir = path.join(folder, 'unknown');
  return fs.readdirSync(dir).flatMap((f) =>
    fs
      .readFileSync(path.join(dir, f), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l)),
  );
};

describe('FileLogDriver deferred request snapshot', () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'filelog-'));
    buffer = fileBuffer(folder);
  });
  afterEach(() => {
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it('AC-10: writes context A after the live context switches to B', async () => {
    let current: RequestLogContext | null = ctx('A');
    let id: string | null = 'A';
    const logger = new LogService({ channel: 'api', id: () => id, request: () => current }, buffer);
    logger.info('first');
    current = ctx('B');
    id = 'B';
    await buffer.flush();
    const [line] = readLines(folder);
    expect(line.request.id).toBe('A');
    expect(line.id).toBe('A');
  });

  it('AC-10: writes context A after the live context becomes null', async () => {
    let current: RequestLogContext | null = ctx('A');
    const logger = new LogService({ channel: 'api', request: () => current }, buffer);
    logger.warn('first');
    current = null;
    await buffer.flush();
    const [line] = readLines(folder);
    expect(line.request).toEqual(ctx('A'));
  });

  it('AC-10: a null snapshot stays null even if the live value later becomes a context', async () => {
    let current: RequestLogContext | null = null;
    const logger = new LogService({ channel: 'api', request: () => current }, buffer);
    logger.info('first');
    current = ctx('late');
    await buffer.flush();
    const [line] = readLines(folder);
    expect('request' in line).toBe(false);
  });

  it('AC-10: interleaved lines each keep their own context', async () => {
    let current: RequestLogContext | null = null;
    const logger = new LogService({ channel: 'api', request: () => current }, buffer);
    current = ctx('A');
    logger.info('a');
    current = ctx('B');
    logger.info('b');
    current = ctx('C');
    await buffer.flush();
    const lines = readLines(folder);
    expect(lines.map((l) => l.message).sort()).toEqual(['a', 'b']);
    for (const l of lines) expect(l.request.id).toBe(l.message.toUpperCase());
  });

  it('writes with appendFile only: an existing file is never truncated and writeFile is not used', async () => {
    const writeSpy = jest.spyOn(fsp, 'writeFile');
    const logger = new LogService({ channel: 'api' }, buffer);
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
    const logger = new LogService({ channel: 'api' }, buffer);
    logger.info('new');
    await buffer.flush();
    expect(readLines(folder).map((l) => l.message)).toEqual(['old', 'new']);
    const freshFolder = path.join(folder, 'fresh-root');
    const freshBuffer = fileBuffer(freshFolder);
    new LogService({ channel: 'api' }, freshBuffer).info('x');
    await freshBuffer.flush();
    const freshDir = path.join(freshFolder, 'unknown');
    const f = path.join(freshDir, fs.readdirSync(freshDir)[0]);
    if (process.platform !== 'win32') expect(fs.statSync(f).mode & 0o777).toBe(0o600);
  });

  it('AC-7: a logger with no request config writes no request key', async () => {
    const logger = new LogService({ channel: 'api' }, buffer);
    logger.info('x');
    await buffer.flush();
    const [line] = readLines(folder);
    expect('request' in line).toBe(false);
    expect(line.message).toBe('x');
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
    new LogService({ service: 'worker', callback }, buffer).info('x');
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ service: 'worker', message: 'x' }));
    expect(fs.existsSync(path.join(folder, 'worker'))).toBe(false);
    await buffer.flush();
    expect(fs.readdirSync(path.join(folder, 'worker'))).toHaveLength(1);
  });

  it('flush never waits for a slow callback; settle does', async () => {
    let release!: () => void;
    let done = false;
    const callback = jest.fn(() => new Promise<void>((resolve) => { release = resolve; }).then(() => { done = true; }));
    new LogService({ service: 'api', callback }, buffer).critical('boom');
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
    new LogService({ service: 'api', callback }, buffer).critical('boom');
    await buffer.flush();
    await buffer.settle();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ level: 'CRITICAL' }));
  });
});

describe('FileLogDriver failing id/request', () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'filelog-fail-'));
    buffer = fileBuffer(folder);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it('a throwing id/request gives null, still writes the line and runs the callback', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const callback = jest.fn().mockResolvedValue(undefined);
    const logger = new LogService({
      service: 'api',
      callback,
      id: () => { throw new Error('sync boom'); },
      request: () => { throw new Error('boom'); },
    }, buffer);
    logger.critical('still here');
    await buffer.flush();
    await buffer.settle();
    const lines = fs.readdirSync(path.join(folder, 'api')).flatMap((f) =>
      fs.readFileSync(path.join(folder, 'api', f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)),
    );
    expect(lines).toEqual([expect.objectContaining({ message: 'still here', id: null })]);
    expect('request' in lines[0]).toBe(false);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ level: 'CRITICAL' }));
  });
});
