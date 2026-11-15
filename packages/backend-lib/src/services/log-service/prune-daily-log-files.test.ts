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

describe('pruneDailyLogFiles empty directory cleanup', () => {
  let root: string;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'log-prune-dirs-'));
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const exists = (p: string) => fs.access(p).then(() => true, () => false);
  const write = async (rel: string, body = 'x') => {
    const full = path.join(root, rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
    return full;
  };

  it('AC-11: removes legacy dirs emptied by the prune, keeps the new layout and root files', async () => {
    const now = new Date('2026-06-27T12:00:00Z');
    await write('api/errors/500/2026-05-01.log');
    await write('ai/2026-05-01.moderate-content.log');
    await write('api/2026-06-27.log', 'today');
    await write('certbot.log', 'root');
    await write('.gitkeep', '');

    const result = await pruneDailyLogFiles(root, 30, now);

    expect(result.failed).toEqual([]);
    expect(await exists(path.join(root, 'api/errors/500'))).toBe(false);
    expect(await exists(path.join(root, 'api/errors'))).toBe(false);
    expect(await exists(path.join(root, 'ai'))).toBe(false);
    expect(await exists(path.join(root, 'api/2026-06-27.log'))).toBe(true);
    expect(await exists(path.join(root, 'certbot.log'))).toBe(true);
    expect(await exists(path.join(root, '.gitkeep'))).toBe(true);
    expect(await exists(root)).toBe(true);
  });

  it('AC-11: removedDirs lists the removed dirs, deepest first', async () => {
    await write('api/errors/500/2026-05-01.log');
    await write('api/2026-06-27.log');
    const result = await pruneDailyLogFiles(root, 30, new Date('2026-06-27T12:00:00Z'));
    expect(result.removedDirs).toEqual([path.join(root, 'api/errors/500'), path.join(root, 'api/errors')]);
  });

  it('AC-11: never removes logRoot, even when everything under it is gone', async () => {
    await write('ai/2026-05-01.log');
    const result = await pruneDailyLogFiles(root, 30, new Date('2026-06-27T12:00:00Z'));
    expect(result.removedDirs).toEqual([path.join(root, 'ai')]);
    expect(await exists(root)).toBe(true);
    expect(result.removedDirs).not.toContain(root);
  });

  it('AC-11: never removes a dir that still holds a non-matching entry', async () => {
    await write('legacy/2026-05-01.log');
    await write('legacy/.gitkeep', '');
    const result = await pruneDailyLogFiles(root, 30, new Date('2026-06-27T12:00:00Z'));
    expect(result.deleted).toEqual([path.join(root, 'legacy/2026-05-01.log')]);
    expect(result.removedDirs).toEqual([]);
    expect(await exists(path.join(root, 'legacy/.gitkeep'))).toBe(true);
  });

  it('AC-11: keeps a dir that still holds a recent file', async () => {
    await write('legacy/2026-05-01.log');
    await write('legacy/2026-06-27.log');
    const result = await pruneDailyLogFiles(root, 30, new Date('2026-06-27T12:00:00Z'));
    expect(result.removedDirs).toEqual([]);
    expect(await exists(path.join(root, 'legacy/2026-06-27.log'))).toBe(true);
  });

  it('AC-11: an already-empty dir is removed, but not when retention is disabled', async () => {
    await fs.mkdir(path.join(root, 'empty'), { recursive: true });
    const off = await pruneDailyLogFiles(root, 0, new Date('2026-06-27T12:00:00Z'));
    expect(off.removedDirs).toEqual([]);
    expect(await exists(path.join(root, 'empty'))).toBe(true);
    const on = await pruneDailyLogFiles(root, 30, new Date('2026-06-27T12:00:00Z'));
    expect(on.removedDirs).toEqual([path.join(root, 'empty')]);
  });

  it('AC-11: the new <service>/<date>.log layout is matched and pruned', async () => {
    await write('worker/2026-05-01.log');
    await write('worker/2026-06-27.log');
    const result = await pruneDailyLogFiles(root, 30, new Date('2026-06-27T12:00:00Z'));
    expect(result.deleted).toEqual([path.join(root, 'worker/2026-05-01.log')]);
    expect(await exists(path.join(root, 'worker'))).toBe(true);
  });
});
