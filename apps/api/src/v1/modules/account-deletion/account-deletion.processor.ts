import { Processor } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { StorageService } from '@repo/backend-lib/services/storage-service/base';
import { stripe } from '@repo/backend-lib/services/payment-service/stripe';
import { paypal } from '@repo/backend-lib/services/payment-service/paypal';
import { getConfigValue } from '@repo/common-lib/config/utils';
import {
  CACHE_KEY_ACTIVE_SUBSCRIPTION,
  CACHE_KEY_PROFILE_STATUS,
  CACHE_KEY_USER_CATEGORIES,
  CACHE_KEY_USER_EXTRA_DATA,
  CACHE_KEY_USER_PUBLIC_ID,
  CACHE_KEY_USERNAME_EXISTS,
} from '@repo/common-lib/constants/cache';
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
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from '@repo/common-lib/constants/events';
import { Job } from 'bullmq';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { Helpers } from 'src/common/services/helpers.service';
import { PlanSubscriptionsRepository } from '../plan-subscriptions/plan-subscriptions.repository';
import { AccountDeletionWarningMail } from '../users/mails/account-deletion-warning.mail';
import { UserRepository } from '../users/users.repository';
import { TempUploadService } from 'src/common/services/temp-upload.service';
import { UsernameHistoryRepository } from '../username-history/username-history.repository';
import { ArtistPublicPagesChangedEvent } from '../edge-cache/events/artist-public-pages-changed.event';

/** `users.public_id` is a UUID; anything else must never reach a recursive storage delete. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** URL prefix per user language — the web uses `localePrefix: "as-needed"` (EN has none). */
const LOCALE_PREFIX: Record<string, string> = { EN: '', ES: '/es', PT: '/pt' };

@Processor(ACCOUNT_DELETION_QUEUE)
export class AccountDeletionProcessor extends GlobalProcessor {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly planSubscriptionsRepository: PlanSubscriptionsRepository,
    private readonly storageService: StorageService,
    private readonly helpers: Helpers,
    private readonly mailService: MailService,
    private readonly accountDeletionWarningMail: AccountDeletionWarningMail,
    private readonly logger: LogService,
    private readonly tempUploads: TempUploadService,
    private readonly usernameHistoryRepository: UsernameHistoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<AccountDeletionJobInput>): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_SEND_ACCOUNT_DELETION_WARNING:
          return await this.sendWarning(job.data.user_id);
        case JOB_DELETE_USER_ACCOUNT:
          return await this.deleteAccount(job.data.user_id);
        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } catch (error) {
      this.logger.error(
        `Account deletion job failed: ${job.name} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        { user_id: job.data?.user_id, error },
      );
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

  private async sendWarning(userId: number) {
    const state = await this.getState(userId);
    // Reopened (or already deleted) since the task queued this: nothing to warn about.
    if (!state?.flagged) return { sent: false, reason: 'not-flagged' };
    if (state.warned) return { sent: false, reason: 'already-sent' };
    if (!state.in_warning_window) return { sent: false, reason: 'not-due' };

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
    this.logger.info(`Account deletion warning queued for user [${userId}]`);
    return { sent: true };
  }

  /**
   * Hard delete. Every step is idempotent, so a retry after a partial failure just finishes the job:
   * payments first (a failure there must not leave a billed customer without an account), then the
   * user's whole storage folder, then the rows in one atomic statement, then caches.
   *
   * Safe against a concurrent "reopen": that is refused once the deletion date has passed
   * (`UserRepository.unflagDeletion`), and this only runs past it — both on the database clock —
   * and the final delete re-checks the condition under a row lock anyway.
   */
  private async deleteAccount(userId: number) {
    const state = await this.getState(userId);
    if (!state) return { deleted: false, reason: 'not-found' };
    if (!state.flagged) return { deleted: false, reason: 'reopened' };
    if (!state.due) return { deleted: false, reason: 'not-due' };

    const user: User = await this.userRepository.findById(userId);
    // The prefix below is deleted recursively: never let a malformed id widen it to `users/`.
    if (!UUID_PATTERN.test(user.public_id)) {
      throw new Error(`Refusing to delete storage for user [${userId}]: unexpected public_id`);
    }

    const log = this.logger.name('account-deletion');
    log.info(`Hard-deleting account of user [${userId}]`);

    await this.cancelPayments(userId, user.stripe_customer_id ?? null);

    // Trailing slash: `users/<uuid>` would otherwise also match a sibling key starting with it.
    const storageDeleted = await this.storageService.deleteDirectory(`users/${user.public_id}/`);
    if (!storageDeleted) {
      // Throw before touching the DB: the folder must not outlive the row that points at it.
      throw new Error(`Could not delete storage folder of user [${userId}]`);
    }
    // Uploads never claimed live in the private bucket, outside that folder. Best-effort: its
    // lifecycle rule expires them within days anyway, so a failure here — including a missing
    // PRIVATE_BUCKET, which throws — must not abort a deletion whose media is already gone.
    const uploadsDeleted = await this.tempUploads
      .deleteUser(user.public_id)
      .catch(() => false);
    if (!uploadsDeleted) {
      log.error(`Could not delete pending uploads of user [${userId}]`);
    }

    // Read before the delete: the row and its `username_history` (FK cascade) go with it, and the
    // edge purge below can no longer resolve them. Only the purge needs this, so a failed read is
    // logged and the deletion goes ahead: the old names' pages then fall back to the edge TTL.
    const reservedUsernames = await this.usernameHistoryRepository
      .findReservedByUser(userId)
      .catch((error: unknown) => {
        log.warn(
          `Could not read the reserved usernames of user [${userId}] for the edge purge - ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return [] as string[];
      });

    if (!(await this.userRepository.hardDeleteById(userId, ACCOUNT_DELETION_GRACE_DAYS))) {
      // Only reachable through a manual DB edit between the checks above and here.
      log.error(`User [${userId}] was not deleted: no longer flagged/due at delete time`);
      return { deleted: false, reason: 'changed-during-delete' };
    }

    await this.helpers.deleteManyCached([
      CACHE_KEY_USER_PUBLIC_ID(userId),
      CACHE_KEY_USERNAME_EXISTS(user.username),
      CACHE_KEY_USER_CATEGORIES(userId),
      CACHE_KEY_USER_EXTRA_DATA(userId),
      CACHE_KEY_PROFILE_STATUS(userId),
      CACHE_KEY_ACTIVE_SUBSCRIPTION(userId),
    ]);
    this.eventEmitter.emit(
      ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
      new ArtistPublicPagesChangedEvent(userId, [user.username, ...reservedUsernames]),
    );

    log.info(`Account of user [${userId}] deleted`);
    return { deleted: true };
  }

  /**
   * Ends billing for good: the active paid subscription is cancelled immediately (renewal may
   * already have been stopped at request time, but the remaining paid period must not keep billing
   * a deleted account), then the Stripe customer, which holds the email and payment methods, is
   * removed. `plan_subscriptions` rows are kept (FK `SET NULL`) for invoice/tax retention.
   */
  private async cancelPayments(userId: number, stripeCustomerId: string | null) {
    const subscription = await this.planSubscriptionsRepository.findActiveSubscription(userId);
    if (subscription?.stripe_id) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_id);
      } catch (error) {
        if (!this.isStripeMissing(error)) throw error;
      }
    }
    if (subscription?.paypal_id) {
      const cancelled = await (await paypal).subscription.cancel(
        subscription.paypal_id,
        'Account deleted',
      );
      if (!cancelled) {
        // Not thrown: PayPal also refuses an already-cancelled subscription, and retrying that
        // forever would block a legally required deletion. The error log mails the admins, who can
        // check the subscription by its id.
        this.logger.error(
          `PayPal subscription [${subscription.paypal_id}] of deleted user [${userId}] could not be cancelled; check it manually`,
        );
      }
    }
    if (stripeCustomerId) {
      try {
        await stripe.customers.del(stripeCustomerId);
      } catch (error) {
        if (!this.isStripeMissing(error)) throw error;
      }
    }
  }

  /** Already cancelled/deleted on a previous attempt: treat as done so retries stay idempotent. */
  private isStripeMissing(error: unknown): boolean {
    const err = error as { code?: string; statusCode?: number };
    return err?.code === 'resource_missing' || err?.statusCode === 404;
  }
}
