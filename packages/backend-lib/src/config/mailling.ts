import { getConfigValue } from '@repo/common-lib/config/utils';
import { MailServiceDriver } from '../services/mail-service';

export const mailingConfig = getConfigValue('mailing');
export const mailingDriver: MailServiceDriver = 'resend';
export const mailingAdmins = mailingConfig.admins;
export const mailingNoreplyEmail = mailingConfig.noreplyEmail;
export const mailingContactEmail = mailingConfig.contactEmail;
export const mailingSupportEmail = mailingConfig.supportEmail;
