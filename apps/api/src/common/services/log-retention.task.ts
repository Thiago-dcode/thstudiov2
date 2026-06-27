import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  FactoryLogService,
  LogService,
  pruneDailyLogFiles,
  resolveDefaultLogFolder,
} from '@repo/backend-lib/services/log-service';
import { getLogRetentionDays } from 'src/config/logging';

@Injectable()
export class LogRetentionTask {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'system',
  });

  @Cron('0 1 * * *', {
    name: 'log-retention-cleanup',
    timeZone: 'UTC',
  })
  async handleLogRetentionCleanup() {
    const retentionDays = getLogRetentionDays();

    if (retentionDays < 1) {
      return;
    }

    const log = this.logger.name('log-retention-cleanup');
    const logRoot = resolveDefaultLogFolder();

    try {
      const result = await pruneDailyLogFiles(logRoot, retentionDays);

      if (result.deleted.length) {
        log.info(
          `Deleted ${result.deleted.length} log file(s) older than ${retentionDays} day(s) under ${logRoot}`,
        );
      } else {
        log.info(`No log files older than ${retentionDays} day(s) to delete`);
      }

      for (const failure of result.failed) {
        log.error(`Failed to delete log file ${failure.file}: ${failure.error}`);
      }
    } catch (error) {
      log.error(
        `Log retention cleanup failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    } finally {
      await LogService.flush();
    }
  }
}
