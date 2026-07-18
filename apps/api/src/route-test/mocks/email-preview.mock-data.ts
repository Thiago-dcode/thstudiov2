import { addMinutes } from 'date-fns';
import { PasswordRecoveryAttempt } from '@repo/common-lib/types/auth';
import { CreateUserContactInput } from '@repo/common-lib/types/user-contact';
import { EnumType } from '@repo/common-lib/constants/enums';
import { WaitListInviteMailData } from 'src/v1/modules/wait-list/mails/wait-list-invite.mail';
import { WaitListReminderMailData } from 'src/v1/modules/wait-list/mails/wait-list-reminder.mail';
import { WaitListWelcomeMailData } from 'src/v1/modules/wait-list/mails/wait-list-welcome.mail';
import { SubscriptionChangedMailData } from 'src/v1/modules/plan-subscriptions/mails/subscription-changed.mail';

export function createMockNewContactInput(userId: number): CreateUserContactInput {
  return {
    user_id: userId,
    contact_name: 'Jane Doe',
    contact_email: 'jane.doe@example.com',
    subject: 'Collaboration inquiry',
    message:
      'Hi! I came across your portfolio and would love to discuss a potential collaboration on an upcoming editorial shoot.\n\nAre you available for a quick call this week?\n\nBest,\nJane',
  };
}

export function createMockPasswordRecoveryAttempt(
  userId: number,
  fallbackUrl: string,
): PasswordRecoveryAttempt {
  const now = new Date();
  return {
    id: 1,
    user_id: userId,
    code: 'preview-recovery-code-abc123',
    fallback_url: fallbackUrl,
    code_validated: false,
    expires_at: addMinutes(now, 10),
    created_at: now,
    updated_at: now,
  };
}

export function createMockTwofaCode(): string {
  return 'a1b2c3';
}

export function createMockWaitListWelcomeData(
  email: string,
  appUrl: string,
): WaitListWelcomeMailData {
  return {
    email,
    position: 12,
    benefitType: 'VIP' as EnumType<'BENEFIT_TYPE'>,
    trialDays: 90,
    benefitMonths: 3,
    registrationUrl: `${appUrl}/auth/register?ref=preview-invite-code`,
    expiresInDays: 7,
  };
}

export function createMockWaitListInviteData(
  email: string,
  appUrl: string,
): WaitListInviteMailData {
  return {
    email,
    validationUrl: `${appUrl}/wait-list/preview-validation-token`,
  };
}

export function createMockWaitListReminderData(
  email: string,
  appUrl: string,
  isFinal = false,
): WaitListReminderMailData {
  return {
    email,
    position: 12,
    benefitType: 'VIP' as EnumType<'BENEFIT_TYPE'>,
    benefitMonths: 3,
    registrationUrl: `${appUrl}/auth/register?ref=preview-invite-code`,
    hoursLeft: isFinal ? 18 : 72,
    isFinal,
  };
}

export function createMockSubscriptionChangedData(isUpgrade: boolean): SubscriptionChangedMailData {
  return isUpgrade
    ? { newPlanName: 'Pro', prevPlanName: 'Free', isUpgrade: true }
    : { newPlanName: 'Free', prevPlanName: 'Pro', isUpgrade: false };
}
