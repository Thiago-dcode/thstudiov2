import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import {
  JOB_UPDATE_MEDIA,
  MEDIA_UPDATE_QUEUE,
} from '@repo/common-lib/constants/queues';
import { UpdateMediaJobInput } from '@repo/common-lib/types/media';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

@Processor(MEDIA_UPDATE_QUEUE)
export class MediaProcessor extends GlobalProcessor {
  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaRepository: MediaRepository,
    private readonly logger: LogService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    try {
      switch (job.name) {
        case JOB_UPDATE_MEDIA:
          return await this.handleUpdateMedia(job.data);
        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.logger.flushAsync();
    }
  }

  private async handleUpdateMedia(input: UpdateMediaJobInput) {
    const log = this.logger.name(JOB_UPDATE_MEDIA);

    try {
      const result = await this.mediaService.updateForUser(
        input.media_id,
        input.user_id,
        input.data,
      );

      await this.mediaRepository.updateById(input.media_id, { status: 'COMPLETED' });

      await QueueHelper.createOrUpdateUserNotificationJob({
        type: 'CREATE_UPDATE_MEDIA',
        user_id: input.user_id,
        entity_id: input.media_id,
        read_at: null,
      });

      return result;
    } catch (error) {
      await this.mediaRepository.updateById(input.media_id, { status: 'COMPLETED' });

      await QueueHelper.createOrUpdateUserNotificationJob({
        type: 'CREATE_UPDATE_MEDIA',
        user_id: input.user_id,
        entity_id: input.media_id,
        read_at: null,
      });

      log.error(
        `Failed to update media [${input.media_id}] (user ${input.user_id}) - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}
