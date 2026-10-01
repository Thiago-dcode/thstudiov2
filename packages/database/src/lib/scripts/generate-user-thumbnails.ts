import Logger from '@repo/backend-lib/utils/console';
import { QueueHelper } from '@repo/backend-lib/utils';
import { killClient } from '../client';
import { Query } from '../facades';
import { connectDb } from './utils';

/**
 * Queues one thumbnail regeneration job per image/GIF of a user; the worker does the encoding,
 * one job at a time (see `MediaProcessor.regenerateThumbnail`). For a single media, use
 * `generate-media-thumbnail`.
 *
 * Jobs are deduped per media (`jobId`), so running this twice while the first batch is still
 * queued adds nothing. Videos are skipped: their thumbnail is `previews[0]`, extracted by ffmpeg.
 *
 * Dry run: lists what would be queued and queues nothing.
 */

type MediaRow = { id: number; public_id: string; thumbnail: string };

function extractRows<T>(result: unknown): T[] {
  const r = result as { rows?: T[] } | T[][] | undefined;
  const rows = Array.isArray(r) ? r[0] : r?.rows ?? [];
  return Array.isArray(rows) ? rows : [];
}

export type GenerateUserThumbnailsOptions = { userId: number; dryRun: boolean };

const generateUserThumbnails = async ({ userId, dryRun }: GenerateUserThumbnailsOptions) => {
  try {
    await connectDb();

    const users = extractRows<{ id: number; username: string }>(
      await Query.raw(`SELECT id, username FROM users WHERE id = $1`, [userId]),
    );
    if (!users.length) {
      Logger.error(`❌ No user with id ${userId}.`);
      process.exit(1);
    }

    const rows = extractRows<MediaRow>(
      await Query.raw(
        `SELECT id, public_id, thumbnail
           FROM media
          WHERE user_id = $1 AND status = 'COMPLETED' AND media_type <> 'VIDEO'
            AND url IS NOT NULL AND thumbnail IS NOT NULL
          ORDER BY id`,
        [userId],
      ),
    );
    const scope = `user ${userId} (@${users[0]!.username})`;
    Logger.info(
      `Found ${rows.length} image/GIF thumbnail(s) for ${scope}${
        dryRun ? ' (dry run: nothing will be queued)' : ''
      }.`,
    );

    if (dryRun) {
      for (const row of rows) {
        Logger.info(`  media #${row.id} (${row.public_id}): ${row.thumbnail}`);
      }
      Logger.success(`✅ Would queue ${rows.length} job(s).`);
      process.exit(0);
    }

    await QueueHelper.createRegenerateMediaThumbnailJobs(rows.map((row) => ({ media_id: row.id })));
    Logger.success(
      `✅ Queued ${rows.length} job(s). The worker processes them one at a time in the background.`,
    );
    process.exit(0);
  } catch (error) {
    Logger.error('❌ generate-user-thumbnails failed:', error);
    process.exit(1);
  } finally {
    await killClient();
  }
};

export { generateUserThumbnails };
