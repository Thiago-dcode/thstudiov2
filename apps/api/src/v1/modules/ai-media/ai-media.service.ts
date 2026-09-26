import { HttpException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LogService } from '@repo/backend-lib/services/log-service';
import { QueueHelper } from '@repo/backend-lib/utils';
import {
  GenerateManyMediaMetadataError,
  GenerateManyMediaMetadataResult,
  GenerateMediaMetadataInput,
} from '@repo/common-lib/types/ai';
import { Media } from '@repo/common-lib/types/media';
import { MediaRepository } from '../media/media.repository';
import { MediaHelper } from '@repo/common-lib/utils/media';
import { AiCreditsHelper } from '@repo/common-lib/utils/ai-credits';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { RequestService } from 'src/common/services/request.service';

@Injectable()
export class AiMediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly requestService: RequestService,
    private readonly logger: LogService,
  ) { }

  /**
   * Queues metadata for many media in one request. Every id must exist and belong to the caller.
   * A row that is not ready is reported and skipped; the rest are still queued. Credits are
   * checked once for the eligible set, so a shortfall enqueues nothing.
   */
  public async generateManyMediaMetadata(
    mediaIds: number[],
  ): Promise<GenerateManyMediaMetadataResult> {
    const userId = this.requestService.user.id;
    const ids = [...new Set(mediaIds)];

    const existing = await this.mediaRepository.findManyByIds(ids);
    if (existing.length !== ids.length) {
      throw new NotFoundException('One or more media were not found');
    }
    if (existing.some((item) => item.user_id !== userId)) {
      throw new UnauthorizedException();
    }

    const byId = new Map(existing.map((item) => [item.id, item]));
    const errors: GenerateManyMediaMetadataError[] = [];
    const eligible: Media[] = [];

    for (const id of ids) {
      const item = byId.get(id);
      if (!item || !MediaHelper.isCompleted(item)) {
        this.logger.info(
          `Skipping generate media metadata: media [${id}] not eligible`,
          {
            media_id: id,
            user_id: userId,
            status: item?.status,
            completed_at: item?.completed_at,
            blocked_at: item?.blocked_at,
          },
        );
        errors.push({ media_id: id, message: 'Media is not in the right state' });
        continue;
      }
      eligible.push(item);
    }

    if (eligible.length) {
      const cost = eligible.reduce(
        (sum, item) => sum + AiCreditsHelper.metadataCreditCost(item.media_type),
        0,
      );
      await this.userExtraDataService.enforceUserLimits(userId, {
        enforceAiCredits: true,
        aiCreditsCost: cost,
      });
    }

    const media: Media[] = [];
    for (const item of eligible) {
      try {
        const queued = await this.generateMediaMetadataAndNotify({
          media_id: item.id,
          user_id: item.user_id,
        });
        if (!queued) {
          errors.push({
            media_id: item.id,
            message: 'Not enough AI credits',
          });
          continue;
        }
        media.push(item);
      } catch (error) {
        const message = this.errorMessage(error);
        this.logger.error(
          `Could not enqueue generate media metadata: media [${item.id}] — ${message}`,
          { media_id: item.id, user_id: item.user_id, error: message },
        );
        errors.push({ media_id: item.id, message });
      }
    }

    this.logger.info(
      `Generate media metadata batch: user [${userId}] queued ${media.length}, skipped ${errors.length}`,
      {
        user_id: userId,
        queued: media.map((item) => item.id),
        skipped: errors.map((item) => item.media_id),
      },
    );

    return { media, errors };
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object' && 'message' in response) {
        const message = (response as { message?: string | string[] }).message;
        if (Array.isArray(message)) return message.join(', ');
        if (message) return message;
      }
    }
    return error instanceof Error ? error.message : String(error);
  }

  public async generateMediaMetadata(mediaId: number) {
    const media = await this.mediaRepository.findById(mediaId);

    if (!MediaHelper.isCompleted(media)) {
      this.logger.info(
        `Skipping generate media metadata: media [${mediaId}] not eligible`,
        {
          media_id: mediaId,
          status: media?.status,
          completed_at: media?.completed_at,
          blocked_at: media?.blocked_at,
        },
      );

      throw new HttpException('Media is not in the right state', 420);
    }

    // Hard gate: a video costs more than an image, so `AiConsumptionGuard`'s any-credit check
    // upstream is not enough here — this is the first point that knows the media's type.
    await this.userExtraDataService.enforceUserLimits(media.user_id, {
      enforceAiCredits: true,
      aiCreditsCost: AiCreditsHelper.metadataCreditCost(media.media_type),
    });

    void this.generateMediaMetadataAndNotify({
      media_id: media.id,
      user_id: media.user_id
    });
    return media;
  }

  /** `null` when the user cannot pay for this item, so a batch can report it instead of spinning. */
  public async generateMediaMetadataAndNotify(
    request: GenerateMediaMetadataInput,
  ): Promise<GenerateMediaMetadataInput | null> {
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
        return null;
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
