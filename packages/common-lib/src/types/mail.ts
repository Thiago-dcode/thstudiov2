import { JOB_ERROR_500_MAIL } from '../constants/queues';

export type Error500MailPayload = {
  message: string;
  options?: Record<string, unknown>;
};

export type Error500MailJob = {
  name: typeof JOB_ERROR_500_MAIL;
  payload: Error500MailPayload;
};

export type MailJob = Error500MailJob; // add more variants later
