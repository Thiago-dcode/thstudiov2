import { InjectQueue, Processor } from '@nestjs/bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { Job, Queue } from 'bullmq';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { LogService } from '@repo/backend-lib/services/log-service';
import {
  CREATE_OR_UPDATE_EMAIL_PREFERENCE,
  EMAIL_PREFERENCES_QUEUE,
  JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL,
} from '@repo/common-lib/constants/constants';
import { CreateOrUpdateEmailPreferenceEvent } from './events/create-or-update-email-preference.event';
import { EmailPreferencesService } from './email-preferences.service';

@Processor(EMAIL_PREFERENCES_QUEUE)
export class EmailPreferencesProcessor extends GlobalProcessor {
  constructor(
    private readonly emailPreferencesService: EmailPreferencesService,
    @InjectQueue(EMAIL_PREFERENCES_QUEUE) private readonly emailPreferencesQueue: Queue,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  @OnEvent(CREATE_OR_UPDATE_EMAIL_PREFERENCE)
  async handleCreateOrUpdateEmailPreferenceEvent(
    event: CreateOrUpdateEmailPreferenceEvent,
  ) {
    await this.emailPreferencesQueue.add(
      JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL,
      event.payload,
      {
        jobId: `email-preference-${event.payload.email}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
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
