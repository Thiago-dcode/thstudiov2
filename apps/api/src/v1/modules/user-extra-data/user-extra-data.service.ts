import { Injectable } from '@nestjs/common';
import { ApiException } from 'src/common/exceptions/Api-exception';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { OnEvent } from '@nestjs/event-emitter';
import {
  UPDATE_USER_EXTRA_DATA_METRICS,
  USER_METRICS_QUEUE,
  JOB_COMPUTE_USER_METRICS,
} from '@repo/common-lib/constants/constants';
import { UpdateUserExtraDataMetricsEvent } from './events/update-user-extra-data-metrics.event';
import { Helpers } from 'src/common/services/helpers.service';
import { PlansService } from '../plans/plans.service';
import { UserStorageRequestService } from '../user-storage-requests/user-storage-request.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class UserExtraDataService {
  constructor(
    private readonly userExtraDataRepository: UserExtraDataRepository,
    private readonly userRequestService: UserStorageRequestService,
    private readonly planService: PlansService,
    private readonly helpers: Helpers,
    @InjectQueue(USER_METRICS_QUEUE) private metricsQueue: Queue
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
   * Throws if the user is currently banned (ban_lift in the future).
   */
  async enforceUserStrikes(userId: number) {
    const extraData = await this.findOneByUserId(userId);
    if (extraData.ban_lift && new Date(extraData.ban_lift) > new Date()) {
      throw ApiException.accountStrikesExceeded(
        `Account banned until ${new Date(extraData.ban_lift).toISOString()}. Strikes: ${extraData.account_strikes}`,
      );
    }
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
      enforceAiCredits?: boolean;
      enforceUserStrikes?:boolean;
    },
  ) {
    const [userExtraData, currentPlan] = await Promise.all([
      this.findOneByUserId(userId),
      this.planService.findUserActivePlan(userId),
    ]);

    const { size, portfolios_count, projects_count, enforceCompressionLevel, storageRequests, enforceAiCredits, enforceUserStrikes } =
      toEnforce;
    if (enforceUserStrikes && userExtraData.ban_lift && new Date(userExtraData.ban_lift) > new Date()) {
      throw ApiException.accountStrikesExceeded(
        `Account banned until ${new Date(userExtraData.ban_lift).toISOString()}. Strikes: ${userExtraData.account_strikes}`,
      );
    }
    if (size && currentPlan.max_media_size !== -1) {
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
    if (enforceAiCredits) {
      const userAiCredits = userExtraData.ai_credits + currentPlan.ai_credits;
      if (userExtraData.ai_credits_consumed >= userAiCredits) {
        throw ApiException.aiCredits(`User consumed all ai credits, consumed:${userExtraData.ai_credits_consumed} of ${userAiCredits}`)
      }

    }
    if (storageRequests && currentPlan.limit_write_storage_per_day !== -1) {
      const currentRequests =
        await this.userRequestService.getTodaysRequestCount(userId);
      const newStorageRequests = currentRequests + storageRequests;

      if (newStorageRequests > currentPlan.limit_write_storage_per_day) {
        throw ApiException.dailyStorageRequests(
          `Daily storage requests limit exceeded. Current: ${currentRequests}, Adding: ${storageRequests}, Max allowed: ${currentPlan.limit_write_storage_per_day}`,
        );
      }
    }
    if (portfolios_count && currentPlan.max_portfolios !== -1) {
     
      const newProjectsCount = userExtraData.portfolios_count + portfolios_count;
      console.log("ENFORCING PORTFOLIO_COUNT",newProjectsCount,currentPlan.max_portfolios)
      if (newProjectsCount > currentPlan.max_portfolios) {
        throw ApiException.maxProjects(
          `Projects limit exceeded. Current: ${userExtraData.portfolios_count}, Adding: ${portfolios_count}, Max allowed: ${currentPlan.max_projects}`,
        );
      }
    }
    // -1 means no limits
    if (projects_count && currentPlan.max_projects !== -1) {
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

    await this.metricsQueue.add(
      JOB_COMPUTE_USER_METRICS,
      { userId: data.userId },
      {
        jobId: `metrics-${data.userId}-${Date.now()}`,
        priority: 10,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

  }
}
