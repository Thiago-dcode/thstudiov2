import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pruneDailyLogFiles } from './prune-daily-log-files';

describe('pruneDailyLogFiles', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'log-prune-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('deletes daily log files older than retentionDays', async () => {
    const channelDir = path.join(tempDir, 'api');
    await fs.mkdir(channelDir, { recursive: true });
    await fs.writeFile(path.join(channelDir, '2026-05-01.log'), 'old');
    await fs.writeFile(path.join(channelDir, '2026-06-27.log'), 'today');
    await fs.writeFile(path.join(channelDir, '2026-06-27.ai-credits-reset.log'), 'named');

    const result = await pruneDailyLogFiles(tempDir, 30, new Date('2026-06-27T12:00:00Z'));

    expect(result.deleted).toEqual([path.join(channelDir, '2026-05-01.log')]);
    expect(result.failed).toEqual([]);
    await expect(fs.access(path.join(channelDir, '2026-05-01.log'))).rejects.toThrow();
    await expect(fs.access(path.join(channelDir, '2026-06-27.log'))).resolves.toBeUndefined();
  });

  it('skips non-daily log filenames', async () => {
    const channelDir = path.join(tempDir, 'api');
    await fs.mkdir(channelDir, { recursive: true });
    const otherFile = path.join(channelDir, 'debug.log');
    await fs.writeFile(otherFile, 'keep');

    const result = await pruneDailyLogFiles(tempDir, 7, new Date('2026-06-27T12:00:00Z'));

    expect(result.deleted).toEqual([]);
    expect(result.skipped).toEqual([otherFile]);
  });

  it('reports a file another replica already deleted as alreadyGone, not failed', async () => {
    const channelDir = path.join(tempDir, 'api');
    await fs.mkdir(channelDir, { recursive: true });
    const racedFile = path.join(channelDir, '2026-05-01.log');
    const ownFile = path.join(channelDir, '2026-05-02.log');
    await fs.writeFile(racedFile, 'old');
    await fs.writeFile(ownFile, 'old');

    // Stands in for the other API replica unlinking the file between our readdir and
    // our unlink - both replicas bind-mount the same host log directory.
    const enoent: NodeJS.ErrnoException = Object.assign(
      new Error(`ENOENT: no such file or directory, unlink '${racedFile}'`),
      { code: 'ENOENT' },
    );
    const unlink = jest
      .spyOn(fs, 'unlink')
      .mockImplementationOnce(() => Promise.reject(enoent));

    const result = await pruneDailyLogFiles(tempDir, 30, new Date('2026-06-27T12:00:00Z'));

    expect(result.alreadyGone).toEqual([racedFile]);
    expect(result.deleted).toEqual([ownFile]);
    expect(result.failed).toEqual([]);

    unlink.mockRestore();
  });

  it('still reports a non-ENOENT unlink error as failed', async () => {
    const channelDir = path.join(tempDir, 'api');
    await fs.mkdir(channelDir, { recursive: true });
    const oldFile = path.join(channelDir, '2026-05-01.log');
    await fs.writeFile(oldFile, 'old');

    const eacces: NodeJS.ErrnoException = Object.assign(
      new Error(`EACCES: permission denied, unlink '${oldFile}'`),
      { code: 'EACCES' },
    );
    const unlink = jest
      .spyOn(fs, 'unlink')
      .mockImplementationOnce(() => Promise.reject(eacces));

    const result = await pruneDailyLogFiles(tempDir, 30, new Date('2026-06-27T12:00:00Z'));

    expect(result.alreadyGone).toEqual([]);
    expect(result.deleted).toEqual([]);
    expect(result.failed).toEqual([{ file: oldFile, error: eacces.message }]);

    unlink.mockRestore();
  });

  it('does nothing when retentionDays is below 1', async () => {
    const channelDir = path.join(tempDir, 'api');
    await fs.mkdir(channelDir, { recursive: true });
    const oldFile = path.join(channelDir, '2020-01-01.log');
    await fs.writeFile(oldFile, 'old');

    const result = await pruneDailyLogFiles(tempDir, 0, new Date('2026-06-27T12:00:00Z'));

    expect(result.deleted).toEqual([]);
    await expect(fs.access(oldFile)).resolves.toBeUndefined();
  });
});
