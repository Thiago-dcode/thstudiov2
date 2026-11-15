import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { format } from 'date-fns';
import os from 'node:os';
import path from 'node:path';
import { FileLogService } from './file-log.service';
import { LogService } from './log.service';
import { getLogProcessContext } from './process-context';
import { RequestLogContext } from '@repo/common-lib/types/request';

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
  const dir = path.join(folder, getLogProcessContext().service);
  return fs.readdirSync(dir).flatMap((f) =>
    fs
      .readFileSync(path.join(dir, f), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l)),
  );
};

describe('FileLogService deferred request snapshot', () => {
  let folder: string;
  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'filelog-'));
  });
  afterEach(() => {
    fs.rmSync(folder, { recursive: true, force: true });
  });

  it('AC-10: writes context A after the live context switches to B', async () => {
    let current: RequestLogContext | null = ctx('A');
    let id: string | null = 'A';
    const logger = new FileLogService({ logFolder: folder, channel: 'api', id: () => id, request: () => current });
    logger.info('first');
    current = ctx('B');
    id = 'B';
    await LogService.flush();
    const [line] = readLines(folder);
    expect(line.request.id).toBe('A');
    expect(line.id).toBe('A');
  });

  it('AC-10: writes context A after the live context becomes null', async () => {
    let current: RequestLogContext | null = ctx('A');
    const logger = new FileLogService({ logFolder: folder, channel: 'api', request: () => current });
    logger.warn('first');
    current = null;
    await LogService.flush();
    const [line] = readLines(folder);
    expect(line.request).toEqual(ctx('A'));
  });

  it('AC-10: a null snapshot stays null even if the live value later becomes a context', async () => {
    let current: RequestLogContext | null = null;
    const logger = new FileLogService({ logFolder: folder, channel: 'api', request: () => current });
    logger.info('first');
    current = ctx('late');
    await LogService.flush();
    const [line] = readLines(folder);
    expect('request' in line).toBe(false);
  });

  it('AC-10: interleaved lines each keep their own context', async () => {
    let current: RequestLogContext | null = null;
    const logger = new FileLogService({ logFolder: folder, channel: 'api', request: () => current });
    current = ctx('A');
    logger.info('a');
    current = ctx('B');
    logger.info('b');
    current = ctx('C');
    await LogService.flush();
    const lines = readLines(folder);
    expect(lines.map((l) => l.message).sort()).toEqual(['a', 'b']);
    for (const l of lines) expect(l.request.id).toBe(l.message.toUpperCase());
  });

  it('writes with appendFile only: an existing file is never truncated and writeFile is not used', async () => {
    const writeSpy = jest.spyOn(fsp, 'writeFile');
    const logger = new FileLogService({ logFolder: folder, channel: 'api' });
    logger.info('one');
    await LogService.flush();
    logger.info('two');
    await LogService.flush();
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
    expect(readLines(folder).map((l) => l.message)).toEqual(['one', 'two']);
  });

  it('keeps pre-existing file content and creates new files owner-only', async () => {
    const dir = path.join(folder, getLogProcessContext().service);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, format(new Date(), 'yyyy-MM-dd') + '.log');
    fs.writeFileSync(file, JSON.stringify({ message: 'old' }) + '\n');
    const logger = new FileLogService({ logFolder: folder, channel: 'api' });
    logger.info('new');
    await LogService.flush();
    expect(readLines(folder).map((l) => l.message)).toEqual(['old', 'new']);
    const freshFolder = path.join(folder, 'fresh-root');
    const fresh = new FileLogService({ logFolder: freshFolder, channel: 'api' });
    fresh.info('x');
    await LogService.flush();
    const freshDir = path.join(freshFolder, getLogProcessContext().service);
    const f = path.join(freshDir, fs.readdirSync(freshDir)[0]);
    if (process.platform !== 'win32') expect(fs.statSync(f).mode & 0o777).toBe(0o600);
  });

  it('AC-7: a logger with no request config writes no request key', async () => {
    const logger = new FileLogService({ logFolder: folder, channel: 'api' });
    logger.info('x');
    await LogService.flush();
    const [line] = readLines(folder);
    expect('request' in line).toBe(false);
    expect(line.message).toBe('x');
  });
});
