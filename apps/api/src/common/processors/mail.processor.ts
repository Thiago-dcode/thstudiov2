import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService, EmailDriverOptions } from '@repo/backend-lib/services/mail-service';
import { ViewService } from '@repo/backend-lib/services/view-service';
import {
  MAIL_QUEUE,
  JOB_SEND_MAIL,
  JOB_SEND_BATCH_EMAIL,
  JOB_ERROR_500_MAIL,
} from '@repo/common-lib/constants/queues';
import type { Error500MailPayload } from '@repo/common-lib/types/mail';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { maskEmailAddresses } from '@repo/backend-lib/services/log-service';
import { isFinalAttempt } from '@repo/backend-lib/utils';
import { createApiLogger } from 'src/common/utils/api-logger';
import { Error500Mail } from 'src/common/mails/error-500.mail';

/** The provider's id for a sent message (Resend `data.id`, nodemailer `messageId`). Never the response. */
export const providerMessageId = (result: unknown): string | null => {
  const r = result as { data?: { id?: unknown }; id?: unknown; messageId?: unknown } | null | undefined;
  const id = r?.data?.id ?? r?.id ?? r?.messageId ?? null;
  return typeof id === 'string' ? id : null;
};

/** Provider errors can quote the recipient (`Invalid to: a@b.c`): addresses are masked out. */
const mailErrorFields = (error: unknown) => ({
  error_name: error instanceof Error ? error.name : typeof error,
  error_message: maskEmailAddresses(error instanceof Error ? error.message : String(error)).slice(0, 300),
});

@Processor(MAIL_QUEUE)
export class MailProcessor extends GlobalProcessor {
  /** Final send failures log `critical` (admin alert); a failed alert mail logs `error` only (no recursion). */
  private readonly logger = createApiLogger({ channel: 'mail' });

  constructor(
    private readonly mailService: MailService,
    private readonly viewService: ViewService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case JOB_SEND_MAIL:
        return await this.sendMail(job.data, job);

      case JOB_SEND_BATCH_EMAIL:
        return await this.sendBatchMail(job.data, job);

      case JOB_ERROR_500_MAIL:
        return await this.sendError500Mail(job.data);

      default:
        throw new Error(`Job name "${job.name}" not recognized`);
    }
  }

  private async sendError500Mail(data: Error500MailPayload) {
    const startedAt = Date.now();
    try {
      const result = await this.mailService.send(
        new Error500Mail(this.viewService, data.message, data.options, undefined, data.subject),
      );
      this.logger.info(
        'Alert mail sent',
        { provider_message_id: providerMessageId(result), duration_ms: Date.now() - startedAt },
        { operation: 'error-500-mail' },
      );
      return result;
    } catch (error) {
      // Never `critical`: that would enqueue another alert mail for the failing alert mail.
      this.logger.error(
        'Alert mail send failed',
        { ...mailErrorFields(error), duration_ms: Date.now() - startedAt },
        { operation: 'error-500-mail' },
      );
      throw error;
    }
  }

  private async sendMail(data: EmailDriverOptions, job: Job) {
    const startedAt = Date.now();
    try {
      const result = await this.mailService.sendRaw(data);
      this.logger.info(
        'Mail sent',
        {
          recipient_count: Array.isArray(data.to) ? data.to.length : 1,
          provider_message_id: providerMessageId(result),
          duration_ms: Date.now() - startedAt,
        },
        { operation: 'send-mail' },
      );
      return result;
    } catch (error) {
      this.logSendFailure(job, 'send-mail', { ...mailErrorFields(error), duration_ms: Date.now() - startedAt });
      throw error;
    }
  }

  private async sendBatchMail(data: EmailDriverOptions[], job: Job) {
    const startedAt = Date.now();
    try {
      const result = await this.mailService.sendBatchRaw(data);
      this.logger.info(
        'Batch mail sent',
        { count: data.length, duration_ms: Date.now() - startedAt },
        { operation: 'send-batch-mail' },
      );
      return result;
    } catch (error) {
      this.logSendFailure(job, 'send-batch-mail', {
        count: data.length,
        ...mailErrorFields(error),
        duration_ms: Date.now() - startedAt,
      });
      throw error;
    }
  }

  /** Alerts on the final attempt only; earlier attempts are retried and logged `error`. */
  private logSendFailure(job: Job, operation: string, fields: Record<string, unknown>) {
    if (isFinalAttempt(job)) {
      this.logger.critical('Mail send failed permanently', { ...fields, will_retry: false }, { operation });
    } else {
      this.logger.error('Mail send failed', { ...fields, will_retry: true }, { operation });
    }
  }
}
