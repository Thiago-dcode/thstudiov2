import { Processor } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { CACHE_KEY_USER_EXTRA_DATA } from '@repo/common-lib/constants/cache';
import { Query } from '@repo/database/facades';
import { Media } from '@repo/common-lib/types/media';
import { MediaHelper } from '@repo/common-lib/utils/media';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { CREDIT_CONSUMING_LLM_USAGE_TYPES } from '@repo/common-lib/constants/limits';
import { AiCreditsHelper } from '@repo/common-lib/utils/ai-credits';
import { LlmTokensUsageSchema } from '@repo/common-lib/schemas/llm-tokens-usage';
import {
  USER_METRICS_QUEUE,
  JOB_COMPUTE_USER_METRICS,
} from '@repo/common-lib/constants/queues';
import { GlobalProcessor } from 'src/common/processors/global.processor';

/** Everything {@link MediaHelper.storageBytes} needs, and nothing else, per media row. */
type MediaStorageRow = Pick<
  Media,
  'id' | 'bytes' | 'thumbnail_bytes' | 'previews_bytes' | 'video_preview_bytes'
>;

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
        this.userExtraDataRepository.findOrCreateByUserId(userId),
        Promise.all([
          Query.table('media')
            .select([
              'id',
              'bytes',
              'thumbnail_bytes',
              'previews_bytes',
              'video_preview_bytes',
            ])
            .where('user_id', userId)
            .softDeletes(true)
            .get<MediaStorageRow[]>(),
          this.cacheManager.del(CACHE_KEY_USER_EXTRA_DATA(userId)),
        ]),
      ]);

      const totalBytes = media.reduce(
        (prev, curr) => prev + MediaHelper.storageBytes(curr),
        0,
      );
      const storage_used_mb =
        totalBytes > 0
          ? Math.round((totalBytes / (1024 * 1024)) * 100) / 100
          : 0;
      const media_count = media.length;

      const [projects_count, portfolios_count, collections_count, services_count, clients_count, creditConsumingUsageRows, account_strikes] =
        await Promise.all([
          Query.table('projects')
            .softDeletes(true)
            .where('user_id', userId)
            .count(),
          Query.table('portfolios')
            .softDeletes(true)
            .where('user_id', userId)
            .count(),
          Query.table('collections')
            .where('user_id', userId)
            .count(),
          Query.table('services')
            .softDeletes(true)
            .where('user_id', userId)
            .count(),
          Query.table('clients')
            .softDeletes(true)
            .where('user_id', userId)
            .count(),
          // Successful AI requests since the last reset. Credits are weighted per usage_type
          // (a video metadata call costs more than an image one) via AiCreditsHelper below.
          Query.table('llm_tokens_usage')
            .select(['usage_type'])
            .where('user_id', userId)
            .where('created_at', '>', extraData.last_ai_credits_reset)
            .where('matches_expected_response', true)
            .whereIn('usage_type', CREDIT_CONSUMING_LLM_USAGE_TYPES)
            .get<Pick<LlmTokensUsageSchema, 'usage_type'>[]>(),
          // Count moderation violations since last strike reset
          Query.table('media_moderations')
            .where('user_id', userId)
            .where('is_allowed', false)
            .where('created_at', '>', extraData.ban_start)
            .count(),
        ]);

      const ai_credits_consumed = AiCreditsHelper.consumedFromUsageRows(
        creditConsumingUsageRows,
      );

      const metrics = {
        storage_used_mb,
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
