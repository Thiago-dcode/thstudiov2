import { config } from '@repo/backend-lib/config';
import { MailServiceDriver } from '@repo/backend-lib/services/mail-service';

export const mailingConfig = config().mailing;
export const mailingDriver: MailServiceDriver = 'nodemailer';
export const mailingFrom = mailingConfig.username;
export const mailingAdmins = mailingConfig.admins;
