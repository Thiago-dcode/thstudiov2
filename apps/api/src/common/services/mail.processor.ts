import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService, EmailDriverOptions } from '@repo/backend-lib/services/mail-service';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import {
  MAIL_QUEUE,
  JOB_SEND_MAIL,
} from '@repo/common-lib/constants/constants';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'mail',
  });

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case JOB_SEND_MAIL:
        return await this.sendMail(job.data);

      default:
        throw new Error(`Job name "${job.name}" not recognized`);
    }
  }

  private async sendMail(data: EmailDriverOptions) {
    const log = this.logger.name('send-mail');
    try {
      await this.mailService.sendRaw(data);
      log.info(`Mail sent to ${Array.isArray(data.to) ? data.to.join(', ') : data.to} — subject: ${data.subject}`);
    } catch (error) {
      log.error(
        `Failed to send mail to ${data.to}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}
