import { Processor } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LlmTokensUsageRepository } from './llm-tokens-usage.repository';
import { MediaModerationRepository } from './media-moderation.repository';
import { LlmTokensUsageEvent } from './events/llm-tokens-usage.event';
import { MediaModerationEvent } from './events/media-moderation.event';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { UpdateUserExtraDataMetricsEvent } from '../user-extra-data/events/update-user-extra-data-metrics.event';
import { UserAiCreditsEndedMail } from '../user-extra-data/mails/user-metrics-ended';
import { UserAccountBannedMail } from '../users/mails/user-account-banned.mail';
import { UserService } from '../users/users.service';
import { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';

import { CreateLlmTokensUsageInput } from '@repo/common-lib/types/llm-tokens-usage';
import { CreateMediaModerationInput } from '@repo/common-lib/types/media-moderation';
import {
  AI_QUEUE,
  JOB_RECORD_LLM_USAGE,
  JOB_RECORD_MEDIA_MODERATION,
  LLM_TOKENS_USAGE_EVENT,
  STRIKES_TO_BAN,
  BAN_DURATION_DAYS,
  PERMANENT_BAN_THRESHOLD,
  MEDIA_MODERATION_EVENT,
  UPDATE_USER_EXTRA_DATA_METRICS,
} from '@repo/common-lib/constants/constants';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';

@Processor(AI_QUEUE)
export class AiProcessor extends GlobalProcessor {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'ai',
  });

  constructor(
    private readonly llmTokensUsageRepository: LlmTokensUsageRepository,
    private readonly mediaModerationRepository: MediaModerationRepository,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly mailService: MailService,
    private readonly userAiCreditsEndedMail: UserAiCreditsEndedMail,
    private readonly userAccountBannedMail: UserAccountBannedMail,
    private readonly userService: UserService,
    private readonly planSubscriptionsService: PlanSubscriptionsService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(AI_QUEUE) private readonly aiQueue: Queue,
    private readonly appLogService: LogService,
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
    try {
      switch (job.name) {
        case JOB_RECORD_LLM_USAGE:
          return await this.recordLlmUsage(job.data);
        case JOB_RECORD_MEDIA_MODERATION:
          return await this.handleMediaModeration(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.appLogService.flushAsync();
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

      const creditsExhausted = await this.userExtraDataService.checkAiCreditsExhausted(usageData.user_id,1);

      if (creditsExhausted) {
        try {
          const user = await this.userService.findOneCompacted(usageData.user_id);
          if (user) {
            await this.mailService.send(
              this.userAiCreditsEndedMail.setUser(user),
            );
            log.info(`AI credits ended email sent to user ${usageData.user_id}`);
          }
        } catch (error) {
          log.error(
            `Failed to send AI credits email for user [${usageData.user_id}] - ${error instanceof Error ? error.message : 'Unknown error'}`,
            error,
          );
        }
      }

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



  private async handleMediaModeration(moderationData: CreateMediaModerationInput) {
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
      if (!moderation.is_allowed) {
        const extraData = await this.userExtraDataService.findOneByUserId(moderationData.user_id);

        const totalStrikes = extraData.account_strikes + 1;

        if (totalStrikes >= STRIKES_TO_BAN) {
          const newBanCount = extraData.ban_count + 1;
          const banStart = new Date();
          let banLift: Date;
          const isPermanentBan = newBanCount >= PERMANENT_BAN_THRESHOLD;
          if (isPermanentBan) {
            // Permanent ban
            banLift = new Date('9999-12-31');
            // Cancel the user's paid subscription
            await this.planSubscriptionsService.cancel(moderationData.user_id);
          } else {
            const durationDays = BAN_DURATION_DAYS[newBanCount] ?? 3;
            banLift = new Date(banStart);
            banLift.setDate(banLift.getDate() + durationDays);
          }




          await Promise.all([
            this.userExtraDataService.update(extraData.id, {
              ban_start: banStart,
              ban_lift: banLift,
              ban_count: newBanCount,
            }),
            ...(isPermanentBan
              ? [this.userService.banUser(moderationData.user_id, 'Account permanently banned due to repeated policy violations')]
              : []),
          ]);

          const user = await this.userService.findOneCompacted(moderationData.user_id);
          if (user) {
            await this.mailService.send(
              this.userAccountBannedMail.setUser(user),
            );
            log.info(`Account banned email sent to user ${moderationData.user_id} (ban_count: ${newBanCount}, ban_lift: ${banLift.toISOString()})`);
          }
        }

        this.eventEmitter.emit(
          UPDATE_USER_EXTRA_DATA_METRICS,
          new UpdateUserExtraDataMetricsEvent(moderationData.user_id),
        );
      }



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

