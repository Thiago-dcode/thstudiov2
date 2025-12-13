import { getConfigValue } from '@repo/common-lib/config/utils';
import { MailServiceDriver } from '@repo/backend-lib/services/mail-service';

export const mailingConfig = getConfigValue('mailing');
export const mailingDriver: MailServiceDriver = 'nodemailer';
export const mailingFrom = mailingConfig.username;
export const mailingAdmins = mailingConfig.admins;
