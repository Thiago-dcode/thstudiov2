import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { ProfileStatusService } from './profile-status.service';
import { CRON_LOCK_TTL, runCronExclusive } from 'src/common/utils/cron-lock';

/**
 * One-shot backfill on API boot: sync every user's profile_status flags from
 * live users / addresses / categories / portfolios / about_page.
 *
 * Guarded with a static flag so Nest hot-reload / duplicate bootstrap hooks
 * do not re-run in the same process, and with a Redis lock so only one replica runs it.
 */
@Injectable()
export class ProfileStatusTask implements OnApplicationBootstrap {
  private static hasRun = false;

  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'profile-status',
  });

  constructor(private readonly profileStatusService: ProfileStatusService) {}

  async onApplicationBootstrap() {
    if (ProfileStatusTask.hasRun) return;
    ProfileStatusTask.hasRun = true;

    // Every API replica boots this; one run per deploy is enough.
    await runCronExclusive('profile-status-backfill', CRON_LOCK_TTL.boot, async () => {
      const log = this.logger.name('backfill');
      try {
        log.info('Starting profile_status backfill from live user data');
        const affected = await this.profileStatusService.backfillAll();
        log.info(`profile_status backfill finished (affected≈${affected})`);
      } catch (error) {
        log.error(
          `profile_status backfill failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      } finally {
        await LogService.flush();
      }
    });
  }
}
