import { EmailPreferenceSchema } from '../schemas/email-preferences';

export type EmailPreference = Omit<EmailPreferenceSchema, 'created_at' | 'updated_at'>;

export type CreateOrUpdateEmailPreferencePayload = {
  email: string;
  user_id?: number;
  transactional?: boolean;
  marketing?: boolean;
  notifications?: boolean;
  waitlist_updates?: boolean;
};
