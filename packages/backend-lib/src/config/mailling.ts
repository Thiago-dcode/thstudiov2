import { getConfigValue } from '@repo/common-lib/config/utils';
import { MailServiceDriver } from '../services/mail-service';

export const mailingConfig = getConfigValue('mailing');
export const mailingDriver: MailServiceDriver = 'resend';
export const mailingAdmins = mailingConfig.admins;
export const mailingNoreplyEmail = mailingConfig.noreplyEmail;
/**
 * Sender for the user-facing wait-list emails. Mail from a person you can reply to is one of the
 * strongest signals Gmail uses to keep a message out of Promotions; `noreply@` is the opposite.
 */
export const mailingPersonalFromEmail = mailingConfig.personalFromEmail || mailingConfig.noreplyEmail;
export const mailingContactEmail = mailingConfig.contactEmail;
export const mailingSupportEmail = mailingConfig.supportEmail;
