import { Processor } from '@nestjs/bullmq';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { LogService, addLogCorrelation, currentJobAttempt } from '@repo/backend-lib/services/log-service';
import { getConfigValue } from '@repo/common-lib/config/utils';
import {
  ACCOUNT_DELETION_GRACE_DAYS,
  ACCOUNT_DELETION_WARNING_DAYS_BEFORE,
} from '@repo/common-lib/constants/limits';
import {
  ACCOUNT_DELETION_QUEUE,
  JOB_DELETE_USER_ACCOUNT,
  JOB_SEND_ACCOUNT_DELETION_WARNING,
} from '@repo/common-lib/constants/queues';
import { AccountDeletionJobInput, User } from '@repo/common-lib/types/user';
import { accountDeletionDate } from '@repo/common-lib/utils/account-deletion';
import { Job } from 'bullmq';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { AccountDeletionWarningMail } from '../users/mails/account-deletion-warning.mail';
import { UserRepository } from '../users/users.repository';
import { UserService } from '../users/users.service';

/** URL prefix per user language — the web uses `localePrefix: "as-needed"` (EN has none). */
const LOCALE_PREFIX: Record<string, string> = { EN: '', ES: '/es', PT: '/pt' };

@Processor(ACCOUNT_DELETION_QUEUE)
export class AccountDeletionProcessor extends GlobalProcessor {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly accountDeletionWarningMail: AccountDeletionWarningMail,
    private readonly logger: LogService,
  ) {
    super();
  }

  async process(job: Job<AccountDeletionJobInput>): Promise<unknown> {
    addLogCorrelation({ user_id: job.data?.user_id });
    try {
      switch (job.name) {
        case JOB_SEND_ACCOUNT_DELETION_WARNING:
          return await this.sendWarning(job.data.user_id);
        case JOB_DELETE_USER_ACCOUNT:
          return await this.userService.deleteAccount(job.data.user_id);
        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } catch (error) {
      const failure = {
        error_name: error instanceof Error ? error.name : typeof error,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      };
      // A missed legal deletion needs a human, but only once retries are exhausted.
      if (currentJobAttempt()?.is_final) {
        this.logger.critical('Account deletion job failed permanently', { ...failure, will_retry: false });
      } else {
        this.logger.error('Account deletion job failed', { ...failure, will_retry: true });
      }
      throw error;
    } finally {
      await this.logger.flushAsync();
    }
  }

  /** Where the account stands, by the database clock (see `UserRepository.getDeletionState`). */
  private getState(userId: number) {
    return this.userRepository.getDeletionState(
      userId,
      ACCOUNT_DELETION_GRACE_DAYS,
      ACCOUNT_DELETION_WARNING_DAYS_BEFORE,
    );
  }

  /** Every early return is logged: "why didn't it warn" is the usual question. */
  private skip<T extends { reason: string }>(result: T): T {
    this.logger.info('Account deletion step skipped', { step: 'warning', reason: result.reason }, { operation: 'warning' });
    return result;
  }

  private async sendWarning(userId: number) {
    const state = await this.getState(userId);
    // Reopened (or already deleted) since the task queued this: nothing to warn about.
    if (!state?.flagged) return this.skip({ sent: false, reason: 'not-flagged' });
    if (state.warned) return this.skip({ sent: false, reason: 'already-sent' });
    if (!state.in_warning_window) return this.skip({ sent: false, reason: 'not-due' });

    const user: User = await this.userRepository.findById(userId);
    const requestedAt = new Date(user.deletion_requested_at!);

    const lang = user.language ?? 'EN';
    const deletionDate = accountDeletionDate(requestedAt).toLocaleDateString(lang.toLowerCase(), {
      dateStyle: 'long',
      timeZone: 'UTC',
    });
    const reactivateUrl = `${getConfigValue('app').url}${LOCALE_PREFIX[lang] ?? ''}/auth/login?redirectTo=${encodeURIComponent('/atelier/settings')}`;

    await this.mailService.sendAsync(
      this.accountDeletionWarningMail.setData(
        { email: user.email, username: user.username, deletionDate, reactivateUrl },
        lang,
      ),
      { jobId: `account-deletion-warning-mail-${userId}-${requestedAt.getTime()}` },
    );
    // Stamped after queuing the mail: a crash in between re-sends at most once on retry, whereas
    // stamping first could lose the warning entirely.
    await this.userRepository.markDeletionWarningSent(userId);
    this.logger.info('Account deletion warning queued', undefined, { operation: 'warning' });
    return { sent: true };
  }
}
