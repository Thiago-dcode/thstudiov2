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
