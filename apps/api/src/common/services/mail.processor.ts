import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService, EmailDriverOptions } from '@repo/backend-lib/services/mail-service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import {
  MAIL_QUEUE,
  JOB_SEND_MAIL,
  JOB_SEND_BATCH_EMAIL,
} from '@repo/common-lib/constants/constants';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { Helpers } from './helpers.service';

@Processor(MAIL_QUEUE)
export class MailProcessor extends GlobalProcessor {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'mail',
    callback: {
      channel: 'mail/error',
      callback: Helpers.callback500ErrorMail
    }
  });

  constructor(
    private readonly mailService: MailService,
    private readonly logService: LogService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      switch (job.name) {
        case JOB_SEND_MAIL:
          return await this.sendMail(job.data);

        case JOB_SEND_BATCH_EMAIL:
          return await this.sendBatchMail(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.logService.flushAsync();
    }
  }

  private async sendMail(data: EmailDriverOptions) {
    const log = this.logger.name('send-mail');
    const to = Array.isArray(data.to) ? data.to.join(', ') : data.to;
    try {
      log.info(`Sending mail via provider`, {
        to,
        from: data.from,
        subject: data.subject,
        has_html: Boolean(data.html),
        has_text: Boolean(data.text),
      });
      const result = await this.mailService.sendRaw(data);
      log.info(`Mail sent to ${to} — subject: ${data.subject}`, {
        provider_response: result ?? null,
      });
      return result;
    } catch (error) {
      log.channel('mail/error').error(
        `Failed to send mail to ${to}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private async sendBatchMail(data: EmailDriverOptions[]) {
    const log = this.logger.name('send-batch-mail');
    const recipients = data.map((email) => ({
      to: Array.isArray(email.to) ? email.to.join(', ') : email.to,
      from: email.from,
      subject: email.subject,
      has_html: Boolean(email.html),
      has_text: Boolean(email.text),
    }));

    try {
      log.info(`Sending batch mail via provider — ${data.length} email(s)`, {
        recipients,
      });
      const result = await this.mailService.sendBatchRaw(data);
      log.info(`Batch mail sent — ${data.length} email(s)`, {
        recipients,
        provider_response: result ?? null,
      });
      return result;
    } catch (error) {
      log.channel('mail/error').error(
        `Failed to send batch mail (${data.length} emails): ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          recipients,
          error,
        },
      );
      throw error;
    }
  }
}
