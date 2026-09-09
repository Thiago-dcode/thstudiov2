import { HttpException, Injectable } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import { GenerateMediaMetadataInput } from '@repo/common-lib/types/ai';
import { MediaRepository } from '../media/media.repository';
import { MediaHelper } from '@repo/common-lib/utils/media';
import { AiCreditsHelper } from '@repo/common-lib/utils/ai-credits';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';

@Injectable()
export class AiMediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly logger: LogService,
  ) { }

  public async generateMediaMetadata(request: GenerateMediaMetadataInput) {
    const media = await this.mediaRepository.findById(request.media_id);

    if (!MediaHelper.isCompleted(media)) {
      this.logger.info(
        `Skipping generate media metadata: media [${request.media_id}] not eligible`,
        {
          media_id: request.media_id,
          status: media?.status,
          completed_at: media?.completed_at,
          blocked_at: media?.blocked_at,
        },
      );

      throw new HttpException('Media is not in the right state', 420);
    }

    // Hard gate: a video costs more than an image, so `AiConsumptionGuard`'s any-credit check
    // upstream is not enough here — this is the first point that knows the media's type.
    await this.userExtraDataService.enforceUserLimits(request.user_id, {
      enforceAiCredits: true,
      aiCreditsCost: AiCreditsHelper.metadataCreditCost(media.media_type),
    });

    void this.generateMediaMetadataAndNotify(request);
    return media;
  }

  public async generateMediaMetadataAndNotify(request: GenerateMediaMetadataInput) {
    try {
      // The worker's upload path (`generate_metadata: true`) calls this directly, bypassing both
      // `AiConsumptionGuard` and the check above — this is the only gate it ever passes through.
      // A throw here would make BullMQ retry a job that can never succeed, so this skips quietly.
      const media = await this.mediaRepository.findById(request.media_id);
      const cost = AiCreditsHelper.metadataCreditCost(media?.media_type);
      if (!(await this.userExtraDataService.hasAiCreditsFor(request.user_id, cost))) {
        this.logger.info(
          `Skipping generate media metadata: user [${request.user_id}] lacks AI credits (needs ${cost})`,
          { media_id: request.media_id, user_id: request.user_id, cost },
        );
        return request;
      }

      await this.mediaRepository.updateById(request.media_id, {
        status: 'GENERATING_METADATA',
      });

      await QueueHelper.createOrUpdateUserNotificationJob({
        read_at: null,
        entity_id: request.media_id,
        type: 'GENERATE_MEDIA_METADATA',
        user_id: request.user_id,
      });

      await QueueHelper.createGenerateMediaMetadataJob(request);

      this.logger.info(
        `Generate media metadata job enqueued: media [${request.media_id}]`,
        { media_id: request.media_id, user_id: request.user_id },
      );
      return request;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const lower = message.toLowerCase();
      if (
        lower.includes('job') &&
        (lower.includes('already') || lower.includes('exists') || lower.includes('exist'))
      ) {
        this.logger.info(
          `Generate media metadata job already queued (skipped): media [${request.media_id}]`,
        );
        return request;
      }
      throw error;
    }
  }
}
