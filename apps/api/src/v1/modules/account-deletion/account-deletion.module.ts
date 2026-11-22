import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ACCOUNT_DELETION_QUEUE } from '@repo/common-lib/constants/queues';
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
    BullModule.registerQueue({ name: ACCOUNT_DELETION_QUEUE }),
  ],
  providers: [
    AccountDeletionTask,
    AccountDeletionProcessor,
    AccountDeletionWarningMail,
  ],
})
export class AccountDeletionModule {}
