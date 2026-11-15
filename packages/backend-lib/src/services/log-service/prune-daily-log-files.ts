import fs from 'node:fs/promises';
import path from 'node:path';
import { isValid, parse, startOfDay, subDays } from 'date-fns';

/**
 * Matches the current `<service>/2026-06-27.log` and the legacy per-channel files
 * (`<channel>/<sub>/2026-06-27.log`, `2026-06-27.media-moderation.log`) at any depth, so the
 * old layout ages out under the same retention.
 */
const DAILY_LOG_FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})(?:\.(.+))?\.log$/;

export type PruneDailyLogFilesResult = {
  deleted: string[];
  /** Files that vanished between the `readdir` and the `unlink` - see the ENOENT note below. */
  alreadyGone: string[];
  skipped: string[];
  failed: { file: string; error: string }[];
  /** Subdirectories left empty by the prune (deepest first). `logRoot` itself is never removed. */
  removedDirs: string[];
};

export async function pruneDailyLogFiles(
  logRoot: string,
  retentionDays: number,
  now: Date = new Date(),
): Promise<PruneDailyLogFilesResult> {
  const result: PruneDailyLogFilesResult = {
    deleted: [],
    alreadyGone: [],
    skipped: [],
    failed: [],
    removedDirs: [],
  };

  if (retentionDays < 1) {
    return result;
  }

  const cutoff = startOfDay(subDays(now, retentionDays));

  async function walk(dir: string): Promise<void> {
    let entries;

    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const match = entry.name.match(DAILY_LOG_FILE_PATTERN);
      if (!match) {
        result.skipped.push(fullPath);
        continue;
      }

      const fileDate = parse(match[1], 'yyyy-MM-dd', new Date());
      if (!isValid(fileDate) || startOfDay(fileDate) >= cutoff) {
        if (!isValid(fileDate)) {
          result.skipped.push(fullPath);
        }
        continue;
      }

      try {
        await fs.unlink(fullPath);
        result.deleted.push(fullPath);
      } catch (error) {
        // Same reasoning as the `readdir` guard above: ENOENT means the goal - the file
        // is gone - is already met, so it is not a failure. Every API replica bind-mounts
        // the same host log directory and runs its own copy of the retention cron, so on
        // a shared volume the replicas race and the loser's unlink lands here. Reporting
        // that as an error made a successful prune look broken every night.
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          result.alreadyGone.push(fullPath);
          continue;
        }

        result.failed.push({
          file: fullPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Post-order, so children go before their parent. Drops the legacy per-status error dirs and
    // per-channel dirs once their files aged out; a dir holding anything at all (`.gitkeep`,
    // today's file) stays.
    if (dir !== logRoot) {
      await removeIfEmpty(dir);
    }
  }

  async function removeIfEmpty(dir: string): Promise<void> {
    try {
      if ((await fs.readdir(dir)).length > 0) return;
      // Non-recursive: fails with ENOTEMPTY if a writer created a file since the readdir.
      await fs.rmdir(dir);
      result.removedDirs.push(dir);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTEMPTY' || code === 'EEXIST') return;
      result.failed.push({
        file: dir,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await walk(logRoot);
  return result;
}
