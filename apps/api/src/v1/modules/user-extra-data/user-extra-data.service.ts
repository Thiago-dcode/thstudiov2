import { Injectable } from '@nestjs/common';
import { ApiException } from 'src/common/exceptions/api-exception';
import { UserExtraDataRepository } from './user-extra-data.repository';
import { OnEvent } from '@nestjs/event-emitter';
import { SET_INITIAL_USER_EXTRA_DATA_EVENT } from '@repo/common-lib/constants/events';
import { CACHE_KEY_USER_EXTRA_DATA } from '@repo/common-lib/constants/cache';
import { SetInitialUserExtraDataEvent } from './events/set-initial-user-extra-data.event';
import { Helpers } from 'src/common/services/helpers.service';
import { PlansService } from '../plans/plans.service';
import { UserStorageRequestService } from '../user-storage-requests/user-storage-request.service';
import { FactoryLogService } from '@repo/backend-lib/services/log-service';
import { UpdateOrCreateUserExtraDataInput } from '@repo/common-lib/types/user-extra-data';
import { UserLimits } from '@repo/common-lib/utils/user-limits';

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
  ) { }
  create() {
    return 'This action adds a new userExtraDatum';
  }

  findAll() {
    return `This action returns all userExtraData`;
  }

  async update(id: number, data: UpdateOrCreateUserExtraDataInput) {

    return await this.userExtraDataRepository.updateById(id, data)
  }

  async findOneByUserId(userId: number) {
    return await this.helpers.cacheRemember(
      CACHE_KEY_USER_EXTRA_DATA(userId),
      this.userExtraDataRepository.findByUserId(userId),
      {
        append_language: false,
        ttl: 1000 * 60 * 60 * 24,
      },
    );
  }
  /** Check if AI credits just crossed the exhaustion threshold */
  async checkAiCreditsExhausted(userId: number, offset = 0): Promise<boolean> {
    const extraData = await this.userExtraDataRepository.findByUserId(userId);
    const currentPlan = await this.planService.findUserActivePlan(userId);
    const totalAiCredits = extraData.ai_credits + currentPlan.ai_credits;
    const newConsumed = extraData.ai_credits_consumed + offset;

    return extraData.ai_credits_consumed < totalAiCredits && newConsumed >= totalAiCredits;
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
      collections_count?: number;
      services_count?: number;
      enforceAiCredits?: boolean;
      enforceUserStrikes?: boolean;
    },
  ) {
    const [userExtraData, currentPlan] = await Promise.all([
      this.findOneByUserId(userId),
      this.planService.findUserActivePlan(userId),
    ]);

    const { size, portfolios_count, collections_count, services_count, projects_count, enforceCompressionLevel, storageRequests, enforceAiCredits, enforceUserStrikes } =
      toEnforce;
    if (
      enforceUserStrikes &&
      !UserLimits.accountStrikes({ userExtraData })
    ) {
      throw ApiException.accountStrikesExceeded(
        `Account banned until ${new Date(userExtraData.ban_lift).toISOString()}. Strikes: ${userExtraData.account_strikes}`,
      );
    }
    if (
      size &&
      !UserLimits.storageSize({
        userExtraData,
        userPlan: currentPlan,
        incomingSize: size,
      })
    ) {
      throw ApiException.mediaSize(
        `Media size limit exceeded. Current: ${userExtraData.storage_used_mb}MB, Adding: ${size}MB, Max allowed: ${currentPlan.storage_limit_mb}MB`,
      );
    }

    if (
      enforceCompressionLevel &&
      !UserLimits.mediaCompression({ userPlan: currentPlan })
    ) {
      throw ApiException.compressionNotAllowed(
        `Media compression not allowed with plan: ${currentPlan.name}`,
      );
    }
    if (
      enforceAiCredits &&
      !UserLimits.aiCredits({ userExtraData, userPlan: currentPlan })
    ) {
      const userAiCredits = userExtraData.ai_credits + currentPlan.ai_credits;
      throw ApiException.aiCredits(
        `User consumed all ai credits, consumed:${userExtraData.ai_credits_consumed} of ${userAiCredits}`,
      );
    }
    if (storageRequests) {
      const currentRequests =
        await this.userRequestService.getTodaysRequestCount(userId);
      if (
        !UserLimits.dailyStorageRequests({
          userPlan: currentPlan,
          currentRequests,
          incomingRequests: storageRequests,
        })
      ) {
        throw ApiException.dailyStorageRequests(
          `Daily storage requests limit exceeded. Current: ${currentRequests}, Adding: ${storageRequests}, Max allowed: ${currentPlan.limit_write_storage_per_day}`,
        );
      }
    }
    if (
      portfolios_count &&
      !UserLimits.entityCount({
        currentCount: userExtraData.portfolios_count,
        incomingCount: portfolios_count,
        maxAllowed: currentPlan.max_portfolios,
      })
    ) {
      throw ApiException.maxProjects(
        `Projects limit exceeded. Current: ${userExtraData.portfolios_count}, Adding: ${portfolios_count}, Max allowed: ${currentPlan.max_portfolios}`,
      );
    }
    if (
      collections_count &&
      !UserLimits.entityCount({
        currentCount: userExtraData.collections_count,
        incomingCount: collections_count,
        maxAllowed: currentPlan.max_collections,
      })
    ) {
      throw ApiException.maxProjects(
        `Collections limit exceeded. Current: ${userExtraData.collections_count}, Adding: ${collections_count}, Max allowed: ${currentPlan.max_collections}`,
      );
    }
    if (
      services_count &&
      !UserLimits.entityCount({
        currentCount: userExtraData.services_count,
        incomingCount: services_count,
        maxAllowed: currentPlan.max_services,
      })
    ) {
      throw ApiException.maxServices(
        `Services limit exceeded. Current: ${userExtraData.services_count}, Adding: ${services_count}, Max allowed: ${currentPlan.max_services}`,
      );
    }
    if (
      projects_count &&
      !UserLimits.entityCount({
        currentCount: userExtraData.projects_count,
        incomingCount: projects_count,
        maxAllowed: currentPlan.max_projects,
      })
    ) {
      throw ApiException.maxProjects(
        `Projects limit exceeded. Current: ${userExtraData.projects_count}, Adding: ${projects_count}, Max allowed: ${currentPlan.max_projects}`,
      );
    }
  }
  @OnEvent(SET_INITIAL_USER_EXTRA_DATA_EVENT)
  async handleSetInitialUserExtraData(event: SetInitialUserExtraDataEvent) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const extraData = await this.userExtraDataRepository.create({
      user_id: event.userId,
      next_ai_credits_reset: nextMonth,
    });
    this.logger
      .name('new-user')
      .info(`${SET_INITIAL_USER_EXTRA_DATA_EVENT} user [${event.userId}] extra data`, {
        extraData,
      });
  }
}
