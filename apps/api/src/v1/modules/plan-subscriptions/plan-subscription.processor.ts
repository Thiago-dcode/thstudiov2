import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import {
  CACHE_KEY_ACTIVE_PLAN,
  CACHE_KEY_ACTIVE_SUBSCRIPTION,
  CACHE_KEY_USER_EXTRA_DATA,
  JOB_ON_SUBSCRIPTION_CHANGES,
  PLAN_SUBSCRIPTIONS_QUEUE,
} from '@repo/common-lib/constants/constants';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { BaseUser } from '@repo/common-lib/types/user';
import { Media } from '@repo/common-lib/types/media';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { PlansService } from '../plans/plans.service';
import { Query } from '@repo/database/facades';
import { TableName } from '@repo/common-lib/types/database';
import { Helpers } from 'src/common/services/helpers.service';
import { serviceCacheKeys } from '../user-services/user-service.service';
import { SubscriptionChangedMail } from './mails/subscription-changed.mail';

/** Job payload enriched by the webhook processor with the previous plan's identity, used to detect upgrade vs downgrade. */
export type SubscriptionChangesJobData = BaseUser & {
  prevPlanName: string | null;
  prevPlanBasePrice: number | null;
};

@Processor(PLAN_SUBSCRIPTIONS_QUEUE)
export class PlanSubscriptionProcessor extends GlobalProcessor {
  constructor(
    private readonly logger: LogService,
    private readonly planService: PlansService,
    private readonly userExtraDataService: UserExtraDataService,
    private readonly helpers: Helpers,
    private readonly mailService: MailService,
    private readonly subscriptionChangedMail: SubscriptionChangedMail,
  ) {
    super();
  }

  // ==================== JOB PROCESSOR ====================

  async process(job: Job): Promise<any> {
    this.logger.name(job.name);
    this.logger.info("Processing JOB: " + job.name);
    try {
      switch (job.name) {
        case JOB_ON_SUBSCRIPTION_CHANGES:
          return await this.onSubscriptionChanges(job.data);

        default:
          throw new Error(`Job name "${job.name}" not recognized`);
      }
    } finally {
      await this.logger.flushAsync();
    }
  }

  // ==================== JOB HANDLERS ====================

  private async onSubscriptionChanges(data: SubscriptionChangesJobData) {
    this.logger.name('on-subscription-changes');
    const { id: userId } = data;
    try {
      this.logger.info(`Processing subscription changes for job data`, data);
      await this.helpers.deleteManyCached([
        CACHE_KEY_USER_EXTRA_DATA(userId),
        CACHE_KEY_ACTIVE_PLAN(userId),
        CACHE_KEY_ACTIVE_SUBSCRIPTION(userId),
      ]);
      const currentPlan = await this.planService.findUserActivePlan(userId);

      if (!currentPlan) {

        throw new Error(`User with id [${userId}] does not have an active plan`);
      }


      const userExtraData = await this.userExtraDataService.findOneByUserId(userId);

      const overLimitMb = userExtraData.storage_used_mb - currentPlan.storage_limit_mb;
      this.logger.info(`Storage diff: ${overLimitMb}MB over limit (limit: ${currentPlan.storage_limit_mb}MB, used: ${userExtraData.storage_used_mb}MB)`);

      const blockedMediaResult = await Query.table('media')
        .rawSelect('COALESCE(SUM(media.bytes + media.thumbnail_bytes), 0) as blocked_bytes')
        .where('blocked_at', '!=', null)
        .where('user_id', '=', userId)
        .first<{ blocked_bytes: string }>();
      const currentBlockedMb = parseInt(blockedMediaResult.blocked_bytes) / (1024 * 1024);

      const haveToBeBlockedMb = overLimitMb;
      const diffBlockedMb = haveToBeBlockedMb - currentBlockedMb;

      this.logger.info(`Media blocked: ${currentBlockedMb.toFixed(2)}MB, should be blocked: ${Math.max(0, haveToBeBlockedMb).toFixed(2)}MB`);

      if (haveToBeBlockedMb <= 0) {
        if (currentBlockedMb > 0) {
          this.logger.info(`Unblocking all blocked media (user is within storage limit)`);
          await Query.table('media')
            .where('blocked_at', '!=', null)
            .where('user_id', '=', userId)
            .update(['blocked_at'], [null]);
        }
      } else if (diffBlockedMb > 0) {
        let remainingToBlockMb = diffBlockedMb;
        const unblocked = await Query.table('media')
          .select(['id', 'bytes', 'thumbnail_bytes'])
          .where('blocked_at', null)
          .where('user_id', '=', userId)
          .orderBy('is_active', 'ASC')
          .orderBy('updated_at', 'ASC')
          .get<Pick<Media, 'id' | 'bytes' | 'thumbnail_bytes'>[]>();

        const mediaIdsToBlock: number[] = [];
        for (const item of unblocked) {
          if (remainingToBlockMb <= 0) break;
          const itemMb = (item.bytes + item.thumbnail_bytes) / (1024 * 1024);
          remainingToBlockMb -= itemMb;
          mediaIdsToBlock.push(item.id);
        }

        this.logger.info(`Blocking ${mediaIdsToBlock.length} media items (need to free ${diffBlockedMb.toFixed(2)}MB more)`);
        if (mediaIdsToBlock.length > 0) {
          await Query.table('media')
            .whereIn('id', mediaIdsToBlock)
            .update(['blocked_at'], [new Date()]);
        }
      } else if (diffBlockedMb < 0) {
        let remainingToUnblockMb = Math.abs(diffBlockedMb);
        const blocked = await Query.table('media')
          .select(['id', 'bytes', 'thumbnail_bytes'])
          .where('blocked_at', '!=', null)
          .where('user_id', '=', userId)
          .orderBy('is_active', 'DESC')
          .orderBy('updated_at', 'DESC')
          .get<Pick<Media, 'id' | 'bytes' | 'thumbnail_bytes'>[]>();

        const mediaIdsToUnblock: number[] = [];
        for (const item of blocked) {
          const itemMb = (item.bytes + item.thumbnail_bytes) / (1024 * 1024);
          if (itemMb <= remainingToUnblockMb) {
            remainingToUnblockMb -= itemMb;
            mediaIdsToUnblock.push(item.id);
          }
        }

        this.logger.info(`Unblocking ${mediaIdsToUnblock.length} media items (${Math.abs(diffBlockedMb).toFixed(2)}MB over-blocked)`);
        if (mediaIdsToUnblock.length > 0) {
          await Query.table('media')
            .whereIn('id', mediaIdsToUnblock)
            .update(['blocked_at'], [null]);
        }
      }
      const limitsConfig: {
        table: TableName,
        maxLimit: number,
        currentCount: number,
        activeColumn: string
      }[] = [
          {
            table: 'portfolios',
            maxLimit: currentPlan.max_portfolios,
            currentCount: userExtraData.portfolios_count,
            activeColumn: 'is_active',
          },
          {
            table: 'collections',
            maxLimit: currentPlan.max_collections,
            currentCount: userExtraData.collections_count,
            activeColumn: 'is_active',
          },
          {
            table: 'projects',
            maxLimit: currentPlan.max_projects,
            currentCount: userExtraData.projects_count,
            activeColumn: 'is_active',
          },
          {
            table: 'clients',
            maxLimit: currentPlan.max_clients,
            currentCount: userExtraData.clients_count,
            activeColumn: 'is_active',
          },
          {
            table: 'services',
            maxLimit: currentPlan.max_services,
            currentCount: userExtraData.services_count,
            activeColumn: 'is_active',
          },
        ];

      for (const config of limitsConfig) {

        const query = Query.table(config.table as any).softDeletes(true)
          .where('blocked_at', 'IS NOT', null)
          .where('user_id', '=', userId);

        if (config.activeColumn) {
          //priorize !is_active ones
          query.orderBy(config.activeColumn, 'ASC')
        }
        //Priorize old ones
        query.orderBy('updated_at', 'ASC')

        const currentBlocked = await query.count(false);
        const haveToBeBlocked = config.currentCount - config.maxLimit;

        this.logger.info(`[${config.table}] diff: ${haveToBeBlocked} (limit: ${config.maxLimit}, current: ${config.currentCount})`);

        //-1 mean not limits
        if (haveToBeBlocked <= 0 || config.maxLimit === -1) {
          if (currentBlocked > 0) {
            await query.update(['blocked_at'], [null], false);
          }
        } else {
          const amountToUnblock = currentBlocked - haveToBeBlocked;
          if (amountToUnblock > 0) {
            await query.limit(amountToUnblock).update(['blocked_at'], [null], false);
          } else if (amountToUnblock < 0) {
            const toBlock = Math.abs(amountToUnblock);

            const blockQuery = Query.table(config.table as any).softDeletes(true)
              .where('blocked_at', null)
              .where('user_id', '=', userId);
            if (config.activeColumn) {
              blockQuery.orderBy(config.activeColumn, 'ASC');
            }
            blockQuery.orderBy('updated_at', 'ASC').limit(toBlock);

            await blockQuery.update(['blocked_at'], [new Date()]);
          }
        }
      }

      await this.helpers.deleteManyCached([
        CACHE_KEY_USER_EXTRA_DATA(userId),
        CACHE_KEY_ACTIVE_PLAN(userId),
        CACHE_KEY_ACTIVE_SUBSCRIPTION(userId),
        serviceCacheKeys.allByUser(userId),
      ]);

      // Notify the user about the plan change (upgrade vs downgrade copy).
      // No previous plan (first-ever subscription) counts as an upgrade.
      const isUpgrade =
        data.prevPlanBasePrice === null ||
        currentPlan.base_price > data.prevPlanBasePrice;

      await this.mailService.sendAsync(
        this.subscriptionChangedMail.setData(
          { email: data.email, username: data.username },
          {
            newPlanName: currentPlan.name,
            prevPlanName: data.prevPlanName,
            isUpgrade,
          },
        ),
      );

      return { success: true };
    } catch (error) {
      const isError = error instanceof Error;
      this.logger
        .channel('subscriptions/error')
        .error(
          `Failed to process subscription changes - ${isError ? error.message : 'Unknown error'}`,
          isError ? error : undefined,
        );

      this.logger.channel('subscriptions')
      throw error;
    }
  }
}
