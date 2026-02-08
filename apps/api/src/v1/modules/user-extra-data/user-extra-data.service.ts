import { Inject, Injectable } from '@nestjs/common';
import { ApiException } from 'src/common/exceptions/Api-exception';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { OnEvent } from '@nestjs/event-emitter';
import { UPDATE_USER_EXTRA_DATA_METRICS } from '@repo/common-lib/constants/constants';
import { UpdateUserExtraDataMetricsEvent } from './events/update-user-extra-data-metrics.event';
import { Query } from '@repo/database/facades';
import { Media } from '@repo/common-lib/types/media';
import { Helpers } from 'src/common/services/helpers.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { PlansService } from '../plans/plans.service';
import { UserStorageRequestService } from '../user-storage-requests/user-storage-request.service';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';

@Injectable()
export class UserExtraDataService {
  private readonly logger = FactoryLogService.createLogService('file', {
    channel: 'users',
  });
  constructor(
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly userRequestService: UserStorageRequestService,
    private readonly planService: PlansService,
    private readonly helpers: Helpers,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }
  create() {
    return 'This action adds a new userExtraDatum';
  }

  findAll() {
    return `This action returns all userExtraData`;
  }

  async findOneByUserId(userId: number) {
    return await this.helpers.cacheRemember(
      `user-extra-data-${userId}`,
      this.userExtraDataRepository.findByUserId(userId),
      {
        append_language: false,
        ttl: 1000 * 60 * 60 * 24,
      },
    );
  }

  /**
   * Checks if user constraints are within their plan limits.
   * @param userId - The user ID to check constraints for
   * @param toCheck - Constraints to validate
   * @param toCheck.size - Media size to add in MB
   * @param toCheck.storageRequests - Number of storage requests to add
   * @param toCheck.projects_count - Number of projects to add
   */
  async enforceUserLimits(
    userId: number,
    toEnforce: {
      size?: number;
      storageRequests?: number;
      enforceCompressionLevel?: boolean;
      projects_count?: number;
      portfolios_count?: number;
      enforceAiCredists?: boolean;
    },
  ) {
    const [userExtraData, currentPlan] = await Promise.all([
      this.findOneByUserId(userId),
      this.planService.findUserActivePlan(userId),
    ]);

    const { size, portfolios_count, projects_count, enforceCompressionLevel, storageRequests, enforceAiCredists } =
      toEnforce;

    if (size) {
      const newSize = userExtraData.media_size + size;
      if (newSize > currentPlan.max_media_size) {
        throw ApiException.mediaSize(
          `Media size limit exceeded. Current: ${userExtraData.media_size}MB, Adding: ${size}MB, Max allowed: ${currentPlan.max_media_size}MB`,
        );
      }
    }

    if (enforceCompressionLevel) {
      if (!currentPlan.allow_media_compression) {
        throw ApiException.compressionNotAllowed(
          `Media compression not allowed with plan: ${currentPlan.name}`,
        );
      }
    }
    if (enforceAiCredists) {
      const userAiCredits = userExtraData.ai_credits + currentPlan.ai_credits;
      if (userExtraData.ai_credits_consumed >= userAiCredits) {
        throw ApiException.aiCredits(`User consumed all ai credits, consumed:${userExtraData.ai_credits_consumed} of ${userAiCredits}`)
      }

    }
    if (storageRequests) {
      const currentRequests =
        await this.userRequestService.getTodaysRequestCount(userId);
      const newStorageRequests = currentRequests + storageRequests;

      if (newStorageRequests > currentPlan.limit_write_storage_per_day) {
        throw ApiException.dailyStorageRequests(
          `Daily storage requests limit exceeded. Current: ${currentRequests}, Adding: ${storageRequests}, Max allowed: ${currentPlan.limit_write_storage_per_day}`,
        );
      }
    }
    if (portfolios_count) {
      const newProjectsCount = userExtraData.portfolios_count + portfolios_count;
      if (newProjectsCount > currentPlan.max_portfolios) {
        throw ApiException.maxProjects(
          `Projects limit exceeded. Current: ${userExtraData.portfolios_count}, Adding: ${portfolios_count}, Max allowed: ${currentPlan.max_projects}`,
        );
      }
    }
    if (projects_count) {
      const newProjectsCount = userExtraData.projects_count + projects_count;
      if (newProjectsCount > currentPlan.max_projects) {
        throw ApiException.maxProjects(
          `Projects limit exceeded. Current: ${userExtraData.projects_count}, Adding: ${projects_count}, Max allowed: ${currentPlan.max_projects}`,
        );
      }
    }
  }
  @OnEvent(UPDATE_USER_EXTRA_DATA_METRICS)
  async handleUpdateUserExtraData(data: UpdateUserExtraDataMetricsEvent) {
    const log = this.logger.name('metrics');
    try {
      log.info(`Starting metrics update for user ${data.userId}`);
      const extraData = await this.findOneByUserId(data.userId);
      const [media] = await Promise.all([
        Query.table('media')
          .select(['id', 'bytes', 'thumbnail_bytes'])
          .where('blocked', '=', false)
          .where('user_id', '=', data.userId)
          .get<Pick<Media, 'id' | 'bytes' | 'thumbnail_bytes'>[]>(),
        this.cacheManager.del(`user-extra-data-${data.userId}`),
      ]);

      const totalBytes = media.reduce((prev, curr) => prev + curr.bytes + curr.thumbnail_bytes, 0);
      const media_size =
        totalBytes > 0 ? Math.round((totalBytes / (1024 * 1024)) * 100) / 100 : 0;
      const media_count = media.length;

      const projects_count = await Query.table('projects')
        .softDeletes(true)
        .where('user_id', '=', data.userId)
        .count();
      const portfolios_count = await Query.table('portfolios')
        .softDeletes(true)
        .where('user_id', '=', data.userId)
        .count();
      const services_count = await Query.table('services')
        .softDeletes(true)
        .where('user_id', '=', data.userId)
        .count();
      const clients_count = await Query.table('clients')
        .softDeletes(true)
        .where('user_id', '=', data.userId)
        .count();

      // Count successful AI requests (1 credit = 1 successful request)
      const ai_credits_consumed = await Query.table('llm_tokens_usage')
        .where('user_id', '=', data.userId)
        .where('created_at', '>', extraData.last_ai_credits_reset)
        .where('matches_expected_response', '=', true)
        .count();

      const metrics = {
        media_size,
        media_count,
        portfolios_count,
        projects_count,
        services_count,
        clients_count,
        ai_credits_consumed
      };

      await this.userExtraDataRepository.updateByUserId(data.userId, metrics);

      log.info(`Metrics updated for user ${data.userId}`, metrics);
    } catch (error) {
      log.error(`Failed to update metrics for user ${data.userId}`, {
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
