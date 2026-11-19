import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IndexNowService } from './indexnow.service';
import { CRON_LOCK_TTL, runCronExclusive } from 'src/common/utils/cron-lock';
import { createApiLogger } from 'src/common/utils/api-logger';

/**
 * Hourly IndexNow submission of the public pages changed in the last hour.
 *
 * A sweep rather than a hook on every save: a portfolio edit, its media reordering and the AI SEO
 * rewrite that follows all touch `updated_at` within minutes, and one batched submission per hour
 * covers them all without threading a ping through every write path. The window overlaps the
 * interval by a few minutes so a run that starts late never leaves a gap; a URL submitted twice is
 * harmless.
 */
@Injectable()
export class IndexNowTask {
  private static readonly WINDOW_MS = 65 * 60 * 1000;

  private readonly logger = createApiLogger({
    channel: 'indexnow',
  });

  constructor(private readonly indexNowService: IndexNowService) {}

  @Cron(CronExpression.EVERY_HOUR, { name: 'indexnow-submit', timeZone: 'UTC' })
  async submitRecentChanges() {
    await runCronExclusive('indexnow-submit', CRON_LOCK_TTL.hourly, async () => {
      const op = { operation: 'submit' };
      try {
        const result = await this.indexNowService.submitChangedSince(
          new Date(Date.now() - IndexNowTask.WINDOW_MS),
        );
        if (result.status === 'skipped') return;
        const extra = {
          urls: result.urls,
          http_status: result.httpStatus,
          warmed_images: result.warmedImages,
          duration_ms: result.durationMs,
        };
        if (result.httpStatus === 200 || result.httpStatus === 202) this.logger.info('IndexNow submitted', extra, op);
        else this.logger.warn('IndexNow submitted', extra, op);
      } catch (error) {
        this.logger.error(
          'IndexNow submission failed',
          { error_message: error instanceof Error ? error.message : 'Unknown error' },
          op,
        );
      }
    });
  }
}
