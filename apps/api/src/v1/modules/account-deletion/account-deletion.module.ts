import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { ACCOUNT_DELETION_QUEUE } from '@repo/common-lib/constants/queues';
import { EmailPreferencesModule } from '../email-preferences/email-preferences.module';
import { AccountDeletionWarningMail } from '../users/mails/account-deletion-warning.mail';
import { UserModule } from '../users/users.module';
import { AccountDeletionProcessor } from './account-deletion.processor';
import { AccountDeletionTask } from './account-deletion.task';
import { createApiLogger } from 'src/common/utils/api-logger';

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
    BullModule.registerQueue({ name: ACCOUNT_DELETION_QUEUE }),
  ],
  providers: [
    AccountDeletionTask,
    AccountDeletionProcessor,
    AccountDeletionWarningMail,
    {
      provide: LogService,
      useFactory: () =>
        createApiLogger({
          channel: 'account-deletion',
          // A failed hard delete is a GDPR obligation not met: the processor logs it `critical`,
          // which mails the admins.
        }),
    },
  ],
})
export class AccountDeletionModule {}
