import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { ACCOUNT_DELETION_QUEUE, LOG_QUEUE } from '@repo/common-lib/constants/queues';
import { Queue } from 'bullmq';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { AccountDeletionWarningMail } from '../users/mails/account-deletion-warning.mail';
import { UserModule } from '../users/users.module';
import { AccountDeletionProcessor } from './account-deletion.processor';
import { AccountDeletionTask } from './account-deletion.task';

/**
 * Worker side of self-service account deletion: the daily task and the queue processor (warning
 * email + hard delete). The HTTP side (flag / reopen) and the hard delete itself
 * (`UserService.deleteAccount`) live in `UserModule`; billing is torn down by
 * `PlanSubscriptionsService` through `CANCEL_ACCOUNT_PAYMENTS_EVENT`.
 */
@Module({
  imports: [
    EmailPreferencesModule,
    // `UserService.deleteAccount` and `UserRepository` (deletion state, warning stamp).
    UserModule,
    BullModule.registerQueue({ name: ACCOUNT_DELETION_QUEUE }, { name: LOG_QUEUE }),
  ],
  providers: [
    AccountDeletionTask,
    AccountDeletionProcessor,
    AccountDeletionWarningMail,
    {
      provide: LogService,
      useFactory: (logQueue: Queue) =>
        FactoryLogService.createLogService('file', {
          channel: 'account-deletion',
          // A failed hard delete is a GDPR obligation not met: the processor logs it `critical`,
          // which mails the admins.
        }, logQueue),
      inject: [getQueueToken(LOG_QUEUE)],
    },
  ],
})
export class AccountDeletionModule {}
