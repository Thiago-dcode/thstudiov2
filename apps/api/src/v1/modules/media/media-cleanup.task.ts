import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import {
  AI_MEDIA_QUEUE,
  MEDIA_QUEUE,
  MEDIA_THUMBNAIL_QUEUE,
  MEDIA_UPDATE_QUEUE,
} from '@repo/common-lib/constants/queues';
import type { Queue } from 'bullmq';
import { CRON_LOCK_TTL, runCronExclusive } from 'src/common/utils/cron-lock';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

/**
 * Every deterministic job id that can still be working on a media. All of them are keyed by the
 * media id alone, so a lookup by id finds the job if one exists.
 */
const MEDIA_JOB_IDS: { queue: string; jobId: (mediaId: number) => string }[] = [
  { queue: MEDIA_QUEUE, jobId: (id) => `process-media-${id}` },
  { queue: MEDIA_UPDATE_QUEUE, jobId: (id) => `update-media-${id}` },
  { queue: AI_MEDIA_QUEUE, jobId: (id) => `generate-media-metadata-${id}` },
  { queue: AI_MEDIA_QUEUE, jobId: (id) => `generate-media-metadata-and-notify-${id}` },
  { queue: MEDIA_THUMBNAIL_QUEUE, jobId: (id) => `regenerate-media-thumbnail-${id}` },
];

/** States in which a job may still write to its media. `completed` / `failed` are settled. */
const LIVE_JOB_STATES = new Set(['waiting', 'active', 'delayed', 'prioritized', 'waiting-children']);

/**
 * Hourly removal of first uploads that will never finish.
 *
 * The worker marks a media FAILED when its last attempt fails, so a row that is still processing
 * hours later has lost its job altogether (Redis flushed, the job removed, a crash between the
 * row insert and the enqueue). Nothing will ever complete it, and it would sit in the artist's
 * "Processing" section forever.
 *
 * Safe by construction, each check on its own enough to keep a media:
 * 1. Only rows with no `completed_at` and not FAILED — never a media that ever had an asset.
 * 2. Untouched for {@link STALE_AFTER_HOURS}, far beyond the slowest video transcode.
 * 3. No job for it in any media queue that could still run.
 * 4. The delete re-checks 1 and 2 in the same statement, so a job settling mid-run wins.
 */
@Injectable()
export class MediaCleanupTask {
  private static readonly STALE_AFTER_HOURS = 24;
  /** Blast-radius guard; anything over the cap is picked up by the next run. */
  private static readonly MAX_PER_RUN = 100;

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly mediaService: MediaService,
    private readonly logger: LogService,
  ) { }

  @Cron(CronExpression.EVERY_HOUR, { name: 'stale-media-cleanup', timeZone: 'UTC' })
  async handleStaleMediaCleanup() {
    await runCronExclusive('stale-media-cleanup', CRON_LOCK_TTL.hourly, async () => {
      const queues = new Map<string, Queue>();
      try {
        await this.removeStaleMedia(queues);
      } catch (error) {
        this.logger
          .name('stale-media-cleanup')
          .error(
            `Stale media cleanup failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
            error,
          );
      } finally {
        await Promise.all([...queues.values()].map((queue) => queue.close()));
        await this.logger.flushAsync();
      }
    });
  }

  private async removeStaleMedia(queues: Map<string, Queue>) {
    const log = this.logger.name('stale-media-cleanup');
    const candidates = await this.mediaRepository.findStaleProcessing(
      MediaCleanupTask.STALE_AFTER_HOURS,
      MediaCleanupTask.MAX_PER_RUN,
    );
    if (!candidates.length) return;

    const deleted: number[] = [];
    const kept: number[] = [];
    for (const media of candidates) {
      try {
        if (await this.hasLiveJob(media.id, queues)) {
          kept.push(media.id);
          continue;
        }
        const removed = await this.mediaService.deleteStaleProcessing(
          media,
          MediaCleanupTask.STALE_AFTER_HOURS,
        );
        (removed ? deleted : kept).push(media.id);
      } catch (error) {
        kept.push(media.id);
        log.error(
          `Could not remove stale media [${media.id}] (user ${media.user_id}): ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      }
    }

    log.info(`Stale media cleanup: deleted ${deleted.length}, kept ${kept.length}`, {
      deleted,
      kept,
    });
  }

  private async hasLiveJob(mediaId: number, queues: Map<string, Queue>): Promise<boolean> {
    for (const { queue: name, jobId } of MEDIA_JOB_IDS) {
      let queue = queues.get(name);
      if (!queue) {
        queue = QueueHelper.createQueue(name);
        queues.set(name, queue);
      }
      const job = await queue.getJob(jobId(mediaId));
      if (job && LIVE_JOB_STATES.has(await job.getState())) return true;
    }
    return false;
  }
}
