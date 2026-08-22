import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { LogService } from '@repo/backend-lib/services/log-service';
import {
  EMAIL_PREFERENCES_QUEUE,
  JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL,
} from '@repo/common-lib/constants/queues';
import { EmailPreferencesService } from './email-preferences.service';

@Processor(EMAIL_PREFERENCES_QUEUE)
export class EmailPreferencesProcessor extends GlobalProcessor {
  constructor(
    private readonly emailPreferencesService: EmailPreferencesService,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL:
          return await this.emailPreferencesService.createOrUpdateByEmail(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.appLogService.flushAsync();
    }
  }
}
