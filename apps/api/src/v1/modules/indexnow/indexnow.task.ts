import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { IndexNowService } from './indexnow.service';
import { CRON_LOCK_TTL, runCronExclusive } from 'src/common/utils/cron-lock';

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

  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'indexnow',
  });

  constructor(private readonly indexNowService: IndexNowService) {}

  @Cron(CronExpression.EVERY_HOUR, { name: 'indexnow-submit', timeZone: 'UTC' })
  async submitRecentChanges() {
    await runCronExclusive('indexnow-submit', CRON_LOCK_TTL.hourly, async () => {
      const log = this.logger.name('submit');
      try {
        const result = await this.indexNowService.submitChangedSince(
          new Date(Date.now() - IndexNowTask.WINDOW_MS),
        );
        if (result.status === 'skipped') return;
        const message = `IndexNow submitted ${result.urls} URLs (HTTP ${result.httpStatus})`;
        if (result.httpStatus === 200 || result.httpStatus === 202) log.info(message);
        else log.warn(message);
      } catch (error) {
        log.error(
          `IndexNow submission failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      } finally {
        await LogService.flush();
      }
    });
  }
}
