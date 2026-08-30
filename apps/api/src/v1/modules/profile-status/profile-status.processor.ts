import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import {
  JOB_UPDATE_PROFILE_STATUS,
  PROFILE_STATUS_QUEUE,
} from '@repo/common-lib/constants/queues';
import { UpdateProfileStatusJobInput } from '@repo/common-lib/types/profile-status';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { ProfileStatusService } from './profile-status.service';

@Processor(PROFILE_STATUS_QUEUE)
export class ProfileStatusProcessor extends GlobalProcessor {
  constructor(
    private readonly profileStatusService: ProfileStatusService,
    private readonly logger: LogService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_UPDATE_PROFILE_STATUS:
          return await this.handleUpdate(job.data);
        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.logger.flushAsync();
    }
  }

  private async handleUpdate(input: UpdateProfileStatusJobInput) {
    await this.profileStatusService.applyUpdate(input.user_id, input.fields);
  }
}
