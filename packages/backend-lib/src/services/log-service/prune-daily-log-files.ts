import fs from 'node:fs/promises';
import path from 'node:path';
import { isValid, parse, startOfDay, subDays } from 'date-fns';

/** Matches `2026-06-27.log` and `2026-06-27.media-moderation.log`. */
const DAILY_LOG_FILE_PATTERN = /^(\d{4}-\d{2}-\d{2})(?:\.(.+))?\.log$/;

export type PruneDailyLogFilesResult = {
  deleted: string[];
  skipped: string[];
  failed: { file: string; error: string }[];
};

export async function pruneDailyLogFiles(
  logRoot: string,
  retentionDays: number,
  now: Date = new Date(),
): Promise<PruneDailyLogFilesResult> {
  const result: PruneDailyLogFilesResult = {
    deleted: [],
    skipped: [],
    failed: [],
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
        result.failed.push({
          file: fullPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await walk(logRoot);
  return result;
}
