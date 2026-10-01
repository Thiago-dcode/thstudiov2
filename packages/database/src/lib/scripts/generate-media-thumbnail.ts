import Logger from '@repo/backend-lib/utils/console';
import { QueueHelper } from '@repo/backend-lib/utils';
import { killClient } from '../client';
import { Query } from '../facades';
import { connectDb } from './utils';

/**
 * Queues a thumbnail regeneration job for ONE media; the worker does the encoding, one job at a
 * time (see `MediaProcessor.regenerateThumbnail`). For a whole user, use
 * `generate-user-thumbnails`.
 *
 * The worker re-checks eligibility and skips what no longer qualifies; checking here too is what
 * lets this say WHY nothing was queued instead of exiting quietly.
 *
 * Dry run: reports what would be queued and queues nothing.
 */

type MediaRow = {
  id: number;
  public_id: string;
  thumbnail: string | null;
  status: string;
  media_type: string;
  eligible: boolean;
};

function extractRows<T>(result: unknown): T[] {
  const r = result as { rows?: T[] } | T[][] | undefined;
  const rows = Array.isArray(r) ? r[0] : r?.rows ?? [];
  return Array.isArray(rows) ? rows : [];
}

export type GenerateMediaThumbnailOptions = { mediaId: number; dryRun: boolean };

const generateMediaThumbnail = async ({ mediaId, dryRun }: GenerateMediaThumbnailOptions) => {
  try {
    await connectDb();

    const rows = extractRows<MediaRow>(
      await Query.raw(
        `SELECT id, public_id, thumbnail, status, media_type,
                (status = 'COMPLETED' AND media_type <> 'VIDEO' AND url IS NOT NULL AND thumbnail IS NOT NULL) AS eligible
           FROM media WHERE id = $1`,
        [mediaId],
      ),
    );
    const media = rows[0];
    if (!media) {
      Logger.error(`❌ No media with id ${mediaId}.`);
      process.exit(1);
    }
    if (!media.eligible) {
      Logger.error(
        `❌ media #${mediaId} is not eligible (status ${media.status}, type ${media.media_type}); only completed images/GIFs with a thumbnail are regenerated.`,
      );
      process.exit(1);
    }

    Logger.info(`media #${media.id} (${media.public_id}): ${media.thumbnail}`);
    if (dryRun) {
      Logger.success('✅ Dry run: would queue 1 job.');
      process.exit(0);
    }

    await QueueHelper.createRegenerateMediaThumbnailJob({ media_id: media.id });
    Logger.success('✅ Queued 1 job. The worker processes it in the background.');
    process.exit(0);
  } catch (error) {
    Logger.error('❌ generate-media-thumbnail failed:', error);
    process.exit(1);
  } finally {
    await killClient();
  }
};

export { generateMediaThumbnail };
