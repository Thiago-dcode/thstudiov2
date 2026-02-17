import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LlmTokensUsageRepository } from './llm-tokens-usage.repository';
import { MediaModerationRepository } from './media-moderation.repository';
import { LlmTokensUsageEvent } from './events/llm-tokens-usage.event';
import { MediaModerationEvent } from './events/media-moderation.event';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { UpdateUserExtraDataMetricsEvent } from '../user-extra-data/events/update-user-extra-data-metrics.event';
import { UserExtraDataRepository } from '../user-extra-data/user-extra-data.repository';
import { PlansService } from '../plans/plans.service';
import { UserAiCreditsEndedMail } from '../user-extra-data/mails/user-metrics-ended';
import { UserService } from '../users/users.service';

import { CreateLlmTokensUsageInput } from '@repo/common-lib/types/llm-tokens-usage';
import { CreateMediaModerationInput } from '@repo/common-lib/types/media-moderation';
import {
  AI_QUEUE,
  JOB_RECORD_LLM_USAGE,
  JOB_RECORD_MEDIA_MODERATION,
  LLM_TOKENS_USAGE_EVENT,
  MEDIA_MODERATION_EVENT,
  UPDATE_USER_EXTRA_DATA_METRICS,
} from '@repo/common-lib/constants/constants';

@Processor(AI_QUEUE)
export class AiProcessor extends WorkerHost {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'ai',
  });

  constructor(
    private readonly llmTokensUsageRepository: LlmTokensUsageRepository,
    private readonly mediaModerationRepository: MediaModerationRepository,
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly planService: PlansService,
    private readonly mailService: MailService,
    private readonly userAiCreditsEndedMail: UserAiCreditsEndedMail,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(AI_QUEUE) private readonly aiQueue: Queue,
  ) {
    super();
  }

  // ==================== EVENT LISTENERS ====================

  /** Listen for LLM usage events and enqueue them */
  @OnEvent(LLM_TOKENS_USAGE_EVENT)
  async handleLlmTokensUsageEvent(event: LlmTokensUsageEvent) {
    await this.aiQueue.add(
      JOB_RECORD_LLM_USAGE,
      event.usage,
      {
        jobId: `llm-usage-${event.usage.user_id}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  /** Listen for media moderation events and enqueue them */
  @OnEvent(MEDIA_MODERATION_EVENT)
  async handleMediaModerationEvent(event: MediaModerationEvent) {
    await this.aiQueue.add(
      JOB_RECORD_MEDIA_MODERATION,
      event.moderation,
      {
        jobId: `moderation-${event.moderation.user_id}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  // ==================== JOB PROCESSOR ====================

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case JOB_RECORD_LLM_USAGE:
        return await this.recordLlmUsage(job.data);
      case JOB_RECORD_MEDIA_MODERATION:
        return await this.recordMediaModeration(job.data);

      default:
        throw new Error(`Job name "${job.name}" not recognized`);
    }
  }

  // ==================== JOB HANDLERS ====================

  private async recordLlmUsage(usageData: CreateLlmTokensUsageInput) {
    const log = this.logger.name('llm-tokens-usage');
    try {
      const usage = await this.llmTokensUsageRepository.create(usageData);
      log.info(
        `Usage recorded for user [${usageData.user_id}]`,
        usage,
      );

      // Check if AI credits are now exhausted and send email
      await this.checkAiCreditsExhausted(usageData.user_id, log);

      this.eventEmitter.emit(
        UPDATE_USER_EXTRA_DATA_METRICS,
        new UpdateUserExtraDataMetricsEvent(usageData.user_id),
      );

      return usage;
    } catch (error) {
      log.error(
        `Failed to record usage for user [${usageData.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  /** Send email when AI credits are exhausted (only once, at the threshold crossing) */
  private async checkAiCreditsExhausted(userId: number, log: ReturnType<typeof this.logger.name>) {
    try {
      const extraData = await this.userExtraDataRepository.findByUserId(userId);
      const currentPlan = await this.planService.findUserActivePlan(userId);
      const totalAiCredits = extraData.ai_credits + currentPlan.ai_credits;

      const newConsumed = extraData.ai_credits_consumed + 1;

      // Send email only at the exact threshold crossing
      if (extraData.ai_credits_consumed < totalAiCredits && newConsumed >= totalAiCredits) {
        const user = await this.userService.findOneCompacted(userId);
        if (user) {
          await this.mailService.send(
            this.userAiCreditsEndedMail.setUser(user),
          );
          log.info(`AI credits ended email sent to user ${userId}`);
        }
      }
    } catch (error) {
      // Don't fail the job if email sending fails
      log.error(
        `Failed to check/send AI credits email for user [${userId}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
    }
  }

  private async recordMediaModeration(moderationData: CreateMediaModerationInput) {
    const log = this.logger.name('media-moderation');
    try {
      const moderation = await this.mediaModerationRepository.create(moderationData);
      log.info(
        `Moderation recorded for user [${moderationData.user_id}]`,
        moderation,
      );

      if (moderation.severity > 7) {
        //send a email to support 
      }

      this.eventEmitter.emit(
        UPDATE_USER_EXTRA_DATA_METRICS,
        new UpdateUserExtraDataMetricsEvent(moderationData.user_id),
      );

      return moderation;
    } catch (error) {
      log.error(
        `Failed to record moderation for user [${moderationData.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }
}

