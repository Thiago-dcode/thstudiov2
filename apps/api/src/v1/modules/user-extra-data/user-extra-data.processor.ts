import { Processor } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { Query } from '@repo/database/facades';
import { Media } from '@repo/common-lib/types/media';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import {
  USER_METRICS_QUEUE,
  JOB_COMPUTE_USER_METRICS,
} from '@repo/common-lib/constants/constants';
import { GlobalProcessor } from 'src/common/processors/global.processor';

@Processor(USER_METRICS_QUEUE)
export class UserExtraDataProcessor extends GlobalProcessor {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'users',
  });

  constructor(
    private readonly userExtraDataRepository: UserExtraDataRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly appLogService: LogService,
  ) {
    super();
  }

  async process(job: Job<{ userId: number }>): Promise<any> {
    try {
      switch (job.name) {
        case JOB_COMPUTE_USER_METRICS:
          return await this.computeUserMetrics(job.data.userId);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.appLogService.flushAsync();
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

      const [projects_count, portfolios_count, collections_count, services_count, clients_count, ai_credits_consumed, account_strikes] =
        await Promise.all([
          Query.table('projects')
            .softDeletes(true)
            .where('user_id', '=', userId)
            .count(),
          Query.table('portfolios')
            .softDeletes(true)
            .where('user_id', '=', userId)
            .count(),
          Query.table('collections')
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
          // Skip internal usage types (e.g. MODERATE_MEDIA_CONTENT)
          Query.table('llm_tokens_usage')
            .where('user_id', '=', userId)
            .where('created_at', '>', extraData.last_ai_credits_reset)
            .where('matches_expected_response', '=', true)
            .where('usage_type', '!=', 'MODERATE_MEDIA_CONTENT')
            .count(),
          // Count moderation violations since last strike reset
          Query.table('media_moderations')
            .where('user_id', '=', userId)
            .where('is_allowed', '=', false)
            .where('created_at', '>', extraData.ban_start)
            .count(),
        ]);

      const metrics = {
        media_size,
        media_count,
        portfolios_count,
        collections_count,
        projects_count,
        services_count,
        clients_count,
        ai_credits_consumed,
        account_strikes,
      };




      await this.userExtraDataRepository.updateByUserId(userId, metrics);
      log.info(`Metrics updated for user ${userId}`, metrics);
      return metrics;
    } catch (caught: unknown) {
      const errMsg =
        caught instanceof Error ? caught.message : String(caught);
      log.error(`Failed to update metrics for user ${userId}`, {
        error: errMsg,
      });
      throw caught; // Re-throw so BullMQ can retry
    }
  }
}
