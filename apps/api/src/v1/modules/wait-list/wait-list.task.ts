import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { subDays } from 'date-fns';
import { WaitListRepository } from './wait-list.repository';
import { WaitListService } from './wait-list.service';
import { WaitListReminderMail } from './mails/wait-list-reminder.mail';
import { WaitListFollowUpMail } from './mails/wait-list-follow-up.mail';
import { WAIT_LIST_SHOWCASE_PATH } from './wait-list.constants';
import { CRON_LOCK_TTL, runCronExclusive } from 'src/common/utils/cron-lock';

@Injectable()
export class WaitListTask {
  /** How long a validated entry waits before it is invited to register. */
  private static readonly INVITE_AFTER_VALIDATED_DAYS = 2;

  /** How long after validating an entry gets the "we haven't forgotten about you" email. */
  private static readonly FOLLOW_UP_AFTER_VALIDATED_DAYS = 1;

  /** Same blast-radius guard as {@link MAX_INVITES_PER_RUN}; the window is one day of signups. */
  private static readonly MAX_FOLLOW_UPS_PER_RUN = 200;

  /**
   * Blast-radius guard, not part of the rule. One run queues a single batch mail plus an
   * invitation link per entry, so an unbounded backlog — a launch spike, or the first run after
   * this ships — would go out in one go and start every one of those 7-day invite windows
   * simultaneously. Anything over the cap simply waits for tomorrow's run; raise it if you'd
   * rather drain a backlog faster.
   */
  private static readonly MAX_INVITES_PER_RUN = 200;

  constructor(
    private readonly waitListRepository: WaitListRepository,
    private readonly waitListService: WaitListService,
    private readonly waitListReminderMail: WaitListReminderMail,
    private readonly waitListFollowUpMail: WaitListFollowUpMail,
    private readonly mailService: MailService,
    private readonly logger: LogService,
  ) {}

  /**
   * Daily wait-list nurture run: the day-1 follow-up email, then invites for everyone who validated
   * their email at least {@link INVITE_AFTER_VALIDATED_DAYS} days ago (replacing the manual admin
   * batch invite). The day-0 confirmation is not here — it's queued by validation itself.
   *
   * Runs an hour before the reminder cron rather than alongside it — the two don't interact
   * (a reminder needs `welcome_email_sent_at` to be 2 days old, so entries invited by this run
   * can't be picked up by it), but staggering keeps the two mail bursts apart.
   *
   * Reuses the admin path wholesale: `inviteBatch` enqueues the same job the endpoint does, and
   * the processor does the claiming, invitation-link creation and mailing. Nothing about the
   * invite itself is duplicated here — this only decides *when* and *how many*.
   */
  @Cron('0 11 * * *', { name: 'wait-list-invites', timeZone: 'UTC' })
  async handleWaitListInvites() {
    await runCronExclusive('wait-list-invites', CRON_LOCK_TTL.daily, async () => {
      try {
        const anchor = WaitListTask.dailyAnchor();
        // Follow-ups first: their window ends where today's invite cutoff begins, so nobody in
        // this run gets both.
        await this.sendFollowUps(anchor);
        await this.queueInvites(anchor);
      } finally {
        await this.logger.flushAsync();
      }
    });
  }

  /**
   * Today at 11:00 UTC, the cron's own schedule. Every cutoff in the run derives from this rather
   * than `new Date()`, so consecutive daily runs tile validation time into disjoint windows: run N
   * follows up `(anchor-2d, anchor-1d]` and invites `<= anchor-2d`, and tomorrow's follow-up window
   * starts exactly where today's ended. Cutoffs taken from the clock drift with how late the
   * run fires, which is how one person could get both emails in the same run, minutes apart.
   */
  private static dailyAnchor(now: Date = new Date()): Date {
    const anchor = new Date(now);
    anchor.setUTCHours(11, 0, 0, 0);
    return anchor;
  }

  /**
   * "We haven't forgotten about you": one email per entry, in the day between validation and
   * invite. The window's lower bound keeps it from reaching anyone already past the invite cutoff
   * (a capped backlog, or everyone who validated before this shipped).
   */
  private async sendFollowUps(anchor: Date) {
    try {
      const validatedAfter = subDays(anchor, WaitListTask.INVITE_AFTER_VALIDATED_DAYS);
      const validatedBefore = subDays(anchor, WaitListTask.FOLLOW_UP_AFTER_VALIDATED_DAYS);
      const dueRows = await this.waitListRepository.findWaitingDueForFollowUp(
        validatedAfter,
        validatedBefore,
        WaitListTask.MAX_FOLLOW_UPS_PER_RUN,
      );

      if (!dueRows.length) {
        this.logger.info('No wait list entries due for follow-up.', {
          validated_after: validatedAfter.toISOString(),
          validated_before: validatedBefore.toISOString(),
        });
        return;
      }

      const showcaseUrl = `${getConfigValue('app').url}${WAIT_LIST_SHOWCASE_PATH}`;
      let sentCount = 0;

      for (const row of dueRows) {
        try {
          await this.mailService.sendAsync(
            this.waitListFollowUpMail.setData({ email: row.email, showcaseUrl }, row.language),
            { jobId: `wait-list-follow-up-${row.id}` },
          );
          await this.waitListRepository.updateById(row.id, { follow_up_email_sent_at: new Date() });
          sentCount++;
        } catch (error) {
          this.logger.error(
            `Failed to send wait list follow-up for entry ${row.id} - ${error instanceof Error ? error.message : 'Unknown error'}`,
            error,
          );
        }
      }

      this.logger.info(`Wait list follow-ups sent: ${sentCount}/${dueRows.length}`);
    } catch (error) {
      this.logger.error(
        `wait-list follow-up step failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  private async queueInvites(anchor: Date) {
    try {
      const validatedBefore = subDays(anchor, WaitListTask.INVITE_AFTER_VALIDATED_DAYS);
      const dueCount = await this.waitListRepository.countWaitingValidatedBefore(validatedBefore);

      if (!dueCount) {
        this.logger.info('No validated wait list entries due for invitation.', {
          validated_before: validatedBefore.toISOString(),
        });
        return;
      }

      const count = Math.min(dueCount, WaitListTask.MAX_INVITES_PER_RUN);

      if (count < dueCount) {
        this.logger.warn(
          `Wait list invites capped at ${count}/${dueCount}; the remainder is invited on the next run`,
          { due_count: dueCount, cap: WaitListTask.MAX_INVITES_PER_RUN },
        );
      }

      // The same cutoff goes to the job so the claim selects the rows this count described.
      await this.waitListService.inviteBatch(count, validatedBefore);

      this.logger.info(`Wait list batch invite queued from cron: count=${count}`, {
        due_count: dueCount,
        validated_before: validatedBefore.toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `wait-list invite cron failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  @Cron('0 12 * * *', { name: 'wait-list-reminders', timeZone: 'UTC' })
  async handleWaitListReminders() {
    await runCronExclusive('wait-list-reminders', CRON_LOCK_TTL.daily, async () => {
      const appUrl = getConfigValue('app').url;

      try {
        const expiredCount = await this.waitListRepository.expireInvitedExpiredRows();
        if (expiredCount > 0) {
          this.logger.info(`Marked ${expiredCount} wait-list invite(s) as EXPIRED`);
        }

        const dueRows = await this.waitListRepository.findInvitedDueForReminder();

        if (!dueRows.length) {
          this.logger.info('No INVITED wait list entries due for reminder.');
          return;
        }

        this.logger.info(`Found ${dueRows.length} wait list reminder(s) to send`);

        let sentCount = 0;

        for (const row of dueRows) {
          try {
            const expiresAtMs = new Date(row.expires_at).getTime();
            const nowMs = Date.now();

            const isFinal = expiresAtMs <= nowMs + 24 * 60 * 60 * 1000;
            const hoursLeft = Math.max(1, Math.round((expiresAtMs - nowMs) / 3_600_000));

            await this.mailService.sendAsync(
              this.waitListReminderMail.setData(
                {
                  email: row.email,
                  position: row.position,
                  benefitType: row.benefit_type,
                  benefitMonths: Math.round(row.trial_days / 30),
                  registrationUrl: `${appUrl}/auth/register?ref=${row.invitation_code}`,
                  hoursLeft,
                  isFinal,
                },
                row.language,
              ),
              {
                jobId: `wait-list-reminder-${row.id}-${row.reminder_count}`,
              },
            );

            await this.waitListRepository.markReminderSent(row.id, row.reminder_count + 1, new Date());
            sentCount++;
          } catch (error) {
            this.logger.error(
              `Failed to send wait list reminder for entry ${row.id} - ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
              error,
            );
          }
        }

        this.logger.info(`Wait list reminders sent: ${sentCount}/${dueRows.length}`);
      } catch (error) {
        this.logger.error(
          `wait-list reminder cron failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error,
        );
      } finally {
        await this.logger.flushAsync();
      }
    });
  }
}
