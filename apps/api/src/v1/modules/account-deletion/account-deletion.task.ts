import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  ACCOUNT_DELETION_WARNING_DAYS_BEFORE,
} from '@repo/common-lib/constants/limits';
import { CRON_LOCK_TTL, runCronExclusive } from 'src/common/utils/cron-lock';
import { UserRepository } from '../users/users.repository';

/**
 * Daily self-service account deletion run:
 * 1. "Your account will be deleted in 2 days" email for flagged accounts entering the window.
 * 2. Hard delete for flagged accounts past the grace period.
 *
 * Only decides *who*; the processor re-checks each account (it may have been reopened since) and
 * does the work, one job per user so a failure never blocks the others.
 */
@Injectable()
export class AccountDeletionTask {
  /** Blast-radius guard; anything over the cap is picked up by the next run. */
  private static readonly MAX_PER_RUN = 200;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: LogService,
  ) { }

  @Cron('0 3 * * *', { name: 'account-deletion', timeZone: 'UTC' })
  async handleAccountDeletion() {
    await runCronExclusive('account-deletion', CRON_LOCK_TTL.daily, async () => {
      try {
        // Warnings first, so an account flagged long ago never gets deleted without one.
        await this.queueWarnings();
        await this.queueDeletions();
      } finally {
        await this.logger.flushAsync();
      }
    });
  }

  // Windows are computed by the database clock inside the repository queries.
  private async queueWarnings() {
    const due = await this.userRepository.findDueForDeletionWarning(
      ACCOUNT_DELETION_GRACE_DAYS,
      ACCOUNT_DELETION_WARNING_DAYS_BEFORE,
      AccountDeletionTask.MAX_PER_RUN,
    );
    for (const { id } of due) {
      await QueueHelper.createAccountDeletionWarningJob({ user_id: id });
    }
    this.logger.info(`Account deletion warnings queued: ${due.length}`);
  }

  private async queueDeletions() {
    const due = await this.userRepository.findDueForDeletion(
      ACCOUNT_DELETION_GRACE_DAYS,
      AccountDeletionTask.MAX_PER_RUN,
    );
    for (const { id } of due) {
      await QueueHelper.createDeleteUserAccountJob({ user_id: id });
    }
    this.logger.info(`Account deletions queued: ${due.length}`);
  }
}
