import { EmailPreferenceSchema } from '../schemas/email-preferences';

export type EmailPreference = Omit<EmailPreferenceSchema, 'created_at' | 'updated_at'>;
