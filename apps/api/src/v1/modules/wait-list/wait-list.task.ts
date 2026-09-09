import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { subDays } from 'date-fns';
import { WaitListRepository } from './wait-list.repository';
import { WaitListService } from './wait-list.service';
import { WaitListReminderMail } from './mails/wait-list-reminder.mail';

@Injectable()
export class WaitListTask {
  /** How long a validated entry waits before it is invited to register. */
  private static readonly INVITE_AFTER_VALIDATED_DAYS = 2;

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
    private readonly mailService: MailService,
    private readonly logger: LogService,
  ) {}

  /**
   * Invites everyone who validated their email at least
   * {@link INVITE_AFTER_VALIDATED_DAYS} days ago, replacing the manual admin batch invite.
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
    try {
      const validatedBefore = subDays(new Date(), WaitListTask.INVITE_AFTER_VALIDATED_DAYS);
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
    } finally {
      await this.logger.flushAsync();
    }
  }

  @Cron('0 12 * * *', { name: 'wait-list-reminders', timeZone: 'UTC' })
  async handleWaitListReminders() {
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
  }
}
