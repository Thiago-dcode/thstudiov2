import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { callback500ErrorMail } from '@repo/backend-lib/utils';
import { ACCOUNT_DELETION_QUEUE, LOG_QUEUE } from '@repo/common-lib/constants/queues';
import { Queue } from 'bullmq';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { PlanSubscriptionsRepository } from '../plan-subscriptions/plan-subscriptions.repository';
import { AccountDeletionWarningMail } from '../users/mails/account-deletion-warning.mail';
import { UserRepository } from '../users/users.repository';
import { UsernameHistoryModule } from '../username-history/username-history.module';
import { AccountDeletionProcessor } from './account-deletion.processor';
import { AccountDeletionTask } from './account-deletion.task';

/**
 * Worker side of self-service account deletion: the daily task and the queue processor (warning
 * email + hard delete). The HTTP side (flag / reopen) lives in `UserModule`. Kept separate so it
 * needs no `UserModule`/`PlanSubscriptionsModule` import (those two already import each other's
 * neighbours) — it only takes the repositories it uses.
 */
@Module({
  imports: [
    EmailPreferencesModule,
    // Old usernames, read before a hard delete so their cached pages can be purged.
    UsernameHistoryModule,
    BullModule.registerQueue({ name: ACCOUNT_DELETION_QUEUE }, { name: LOG_QUEUE }),
  ],
  providers: [
    AccountDeletionTask,
    AccountDeletionProcessor,
    AccountDeletionWarningMail,
    UserRepository,
    PlanSubscriptionsRepository,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) =>
        FactoryLogService.createLogService('file', {
          channel: 'account-deletion',
          // A failed hard delete is a GDPR obligation not met: mail the admins.
          callback: {
            channel: 'account-deletion/error',
            callback: callback500ErrorMail,
          },
        }, logQueue),
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
})
export class AccountDeletionModule {}
