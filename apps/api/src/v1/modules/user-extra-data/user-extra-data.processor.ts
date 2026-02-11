import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { PlansService } from '../plans/plans.service';
import { Query } from '@repo/database/facades';
import { Media } from '@repo/common-lib/types/media';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { UserAiCreditsEndedMail } from './mails/user-metrics-ended';
import {
  USER_METRICS_QUEUE,
  JOB_COMPUTE_USER_METRICS,
} from '@repo/common-lib/constants/constants';

@Processor(USER_METRICS_QUEUE)
export class UserExtraDataProcessor extends WorkerHost {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'users',
  });

  constructor(
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly planService: PlansService,
    private readonly mailService: MailService,
    private readonly userAiCreditsEndedMail: UserAiCreditsEndedMail,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  async process(job: Job<{ userId: number }>): Promise<any> {
    switch (job.name) {
      case JOB_COMPUTE_USER_METRICS:
        return await this.computeUserMetrics(job.data.userId);

      default:
        throw new Error(`Job name "${job.name}" not recognized`);
    }
  }

  private async computeUserMetrics(userId: number) {
    const log = this.logger.name('metrics');
    try {
      log.info(`Starting metrics update for user ${userId}`);

      const [extraData, [media]] = await Promise.all([
        this.userExtraDataRepository.findByUserId(userId),
        Promise.all([
          Query.table('media')
            .select(['id', 'bytes', 'thumbnail_bytes'])
            .where('blocked', '=', false)
            .where('user_id', '=', userId)
            .get<Pick<Media, 'id' | 'bytes' | 'thumbnail_bytes'>[]>(),
          this.cacheManager.del(`user-extra-data-${userId}`),
        ]),
      ]);

      const totalBytes = media.reduce(
        (prev, curr) => prev + curr.bytes + curr.thumbnail_bytes,
        0,
      );
      const media_size =
        totalBytes > 0
          ? Math.round((totalBytes / (1024 * 1024)) * 100) / 100
          : 0;
      const media_count = media.length;

      const [projects_count, portfolios_count, services_count, clients_count, ai_credits_consumed] =
        await Promise.all([
          Query.table('projects')
            .softDeletes(true)
            .where('user_id', '=', userId)
            .count(),
          Query.table('portfolios')
            .softDeletes(true)
            .where('user_id', '=', userId)
            .count(),
          Query.table('services')
            .softDeletes(true)
            .where('user_id', '=', userId)
            .count(),
          Query.table('clients')
            .softDeletes(true)
            .where('user_id', '=', userId)
            .count(),
          // Count successful AI requests (1 credit = 1 successful request)
          Query.table('llm_tokens_usage')
            .where('user_id', '=', userId)
            .where('created_at', '>', extraData.last_ai_credits_reset)
            .where('matches_expected_response', '=', true)
            .count(),
        ]);

      const metrics = {
        media_size,
        media_count,
        portfolios_count,
        projects_count,
        services_count,
        clients_count,
        ai_credits_consumed,
      };

      await this.userExtraDataRepository.updateByUserId(userId, metrics);

      const currentPlan = await this.planService.findUserActivePlan(userId);
      const totalAiCredits = extraData.ai_credits + currentPlan.ai_credits;

      // Send user email when AI credits are exhausted
      if (ai_credits_consumed >= totalAiCredits) {
        const user = await Query.table('users')
          .select(['email', 'username'])
          .where('id', '=', userId)
          .first<{ email: string; username: string }>();

        if (user) {
          await this.mailService.send(
            this.userAiCreditsEndedMail.setUser(user),
          );
          log.info(`AI credits ended email sent to user ${userId}`);
        }
      }


      log.info(`Metrics updated for user ${userId}`, metrics);
      return metrics;
    } catch (error) {
      log.error(`Failed to update metrics for user ${userId}`, {
        error: error instanceof Error ? error.message : error,
      });
      throw error; // Re-throw so BullMQ can retry
    }
  }
}
