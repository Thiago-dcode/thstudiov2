import { Module } from '@nestjs/common';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { TestController } from './test.controller';
import { NotifyNewUserMail } from 'src/v1/modules/users/mails/notify-new-user.mail';
import { UserAccountBannedMail } from 'src/v1/modules/users/mails/user-account-banned.mail';
import { UserRepository } from 'src/v1/modules/users/users.repository';
import { EmailPreferencesModule } from 'src/v1/modules/email-preferences/email-preferences.module';
import { UserContactsModule } from 'src/v1/modules/user-contacts/user-contacts.module';
import { PasswordRecoveryMail } from 'src/v1/modules/auth/mails/password-recovery-mail';
import { TwoFAMail } from 'src/v1/modules/auth/mails/twofa-mail';
import { WaitListWelcomeMail } from 'src/v1/modules/wait-list/mails/wait-list-welcome.mail';
import { WaitListInviteMail } from 'src/v1/modules/wait-list/mails/wait-list-invite.mail';
import { WaitListReminderMail } from 'src/v1/modules/wait-list/mails/wait-list-reminder.mail';
import { SubscriptionChangedMail } from 'src/v1/modules/plan-subscriptions/mails/subscription-changed.mail';
import { UserAiCreditsEndedMail } from 'src/v1/modules/user-extra-data/mails/user-metrics-ended';

@Module({
  imports: [EmailPreferencesModule, UserContactsModule],
  controllers: [TestController],
  providers: [
    AdminGuard,
    NotifyNewUserMail,
    UserAccountBannedMail,
    UserAiCreditsEndedMail,
    PasswordRecoveryMail,
    TwoFAMail,
    WaitListWelcomeMail,
    WaitListInviteMail,
    WaitListReminderMail,
    SubscriptionChangedMail,
    UserRepository,
  ],
})
export class TestModule {}
