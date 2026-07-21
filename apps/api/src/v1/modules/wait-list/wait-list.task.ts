import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { LogService } from '@repo/backend-lib/services/log-service';
import { getConfigValue } from '@repo/common-lib/config/utils';
import { WaitListRepository } from './wait-list.repository';
import { WaitListReminderMail } from './mails/wait-list-reminder.mail';

@Injectable()
export class WaitListTask {
  constructor(
    private readonly waitListRepository: WaitListRepository,
    private readonly waitListReminderMail: WaitListReminderMail,
    private readonly mailService: MailService,
    private readonly logger: LogService,
  ) {}

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
