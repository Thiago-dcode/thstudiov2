import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LogService } from '@repo/backend-lib/services/log-service';
import { Helpers } from 'src/common/services/helpers.service';
import {
  PLAN_SUBSCRIPTIONS_QUEUE,
  JOB_ON_SUBSCRIPTION_CHANGES,
} from '@repo/common-lib/constants/constants';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { BaseUser } from '@repo/common-lib/types/user';
import { Media } from '@repo/common-lib/types/media';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { PlansService } from '../plans/plans.service';
import { Query } from '@repo/database/facades';
import { TableName } from '@repo/common-lib/types/database';

@Processor(PLAN_SUBSCRIPTIONS_QUEUE)
export class PlanSubscriptionProcessor extends GlobalProcessor {
  constructor(private readonly logger: LogService, private readonly planService: PlansService, private readonly userExtraDataService: UserExtraDataService) {
    super();
    this.logger.callback({
      channel: 'plan-subscriptions/error',
      callback: Helpers.callback500ErrorMail,
    });
  }

  // ==================== JOB PROCESSOR ====================

  async process(job: Job): Promise<any> {
    this.logger.channel('plan-subscriptions');
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

  private async onSubscriptionChanges(data: BaseUser) {
    this.logger.name('on-subscription-changes');
    const { id: userId } = data;
    try {
      this.logger.info(`Processing subscription changes for job data`, data);
      const currentPlan = await this.planService.findUserActivePlan(userId);

      if (!currentPlan) {

        throw new Error(`User with id [${userId}] does not have an active plan`);
      }


      const userExtraData = await this.userExtraDataService.findOneByUserId(userId);

      const diffStorage = currentPlan.storage_limit_mb - userExtraData.storage_used_mb;
      this.logger.info(`Storage diff: ${diffStorage}MB (limit: ${currentPlan.storage_limit_mb}MB, used: ${userExtraData.storage_used_mb}MB)`);

      if (diffStorage < 0) {
        let remainingToBlockMb = Math.abs(diffStorage);
        const media = await Query.table('media')
          .select(['id', 'bytes', 'thumbnail_bytes', 'blocked_at', 'is_active'])
          .where('blocked_at', null)
          .where('user_id', userId)
          .orderBy('is_active', 'ASC')
          .orderBy('updated_at', 'ASC')
          .get<Pick<Media, 'id' | 'bytes' | 'thumbnail_bytes' | 'blocked_at' | 'is_active'>[]>();

        const mediaIdsToBlock: number[] = [];

        for (const item of media) {
          if (remainingToBlockMb <= 0) break;
          const itemMb = (item.bytes + item.thumbnail_bytes) / (1024 * 1024);
          remainingToBlockMb -= itemMb;
          mediaIdsToBlock.push(item.id);
        }

        this.logger.info(`Blocking ${mediaIdsToBlock.length} media items (need to free ${Math.abs(diffStorage)}MB)`);
        if (mediaIdsToBlock.length > 0) {
          await Query.table('media')
            .whereIn('id', mediaIdsToBlock)
            .update(['blocked_at'], [new Date()]);
        }
      } else if (diffStorage > 0) {
        let remainingToUnblockMb = diffStorage;
        const blockedMedia = await Query.table('media')
          .select(['id', 'bytes', 'thumbnail_bytes', 'blocked_at', 'is_active'])
          .where('blocked_at', '!=', null)
          .where('user_id', '=', userId)
          .orderBy('is_active', 'DESC')
          .orderBy('updated_at', 'DESC')
          .get<Pick<Media, 'id' | 'bytes' | 'thumbnail_bytes' | 'blocked_at' | 'is_active'>[]>();

        const mediaIdsToUnblock: number[] = [];

        for (const item of blockedMedia) {
          const itemMb = (item.bytes + item.thumbnail_bytes) / (1024 * 1024);
          if (itemMb <= remainingToUnblockMb) {
            remainingToUnblockMb -= itemMb;
            mediaIdsToUnblock.push(item.id);
          }
        }

        this.logger.info(`Unblocking ${mediaIdsToUnblock.length} media items (${diffStorage}MB available)`);
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
        const diff = config.maxLimit - config.currentCount;
        this.logger.info(`[${config.table}] diff: ${diff} (limit: ${config.maxLimit}, current: ${config.currentCount})`);

        if (diff < 0) {
          const remainingToBlock = Math.abs(diff);

          let query = Query.table(config.table as any)
            .select(['id', 'blocked_at'])
            .where('blocked_at', '=', null)
            .where('user_id', '=', userId);

          if (config.activeColumn) {
            query = query.orderBy(config.activeColumn, 'ASC');
          }
          query = query.orderBy('updated_at', 'ASC').limit(remainingToBlock);

          const entitiesToBlock = await query.get<{ id: number }[]>();
          const idsToBlock = entitiesToBlock.map((e) => e.id);
          this.logger.info(`[${config.table}] Blocking ${idsToBlock.length} entities (exceeds limit by ${remainingToBlock})`);

          if (idsToBlock.length > 0) {
            await Query.table(config.table as any)
              .whereIn('id', idsToBlock)
              .update(['blocked_at'], [new Date()]);
          }
        } else if (diff > 0) {
          const remainingToUnblock = diff;

          let query = Query.table(config.table as any)
            .select(['id', 'blocked_at'])
            .where('blocked_at', '!=', null)
            .where('user_id', '=', userId);

          if (config.activeColumn) {
            query = query.orderBy(config.activeColumn, 'DESC');
          }
          query = query.orderBy('updated_at', 'DESC').limit(remainingToUnblock);

          const entitiesToUnblock = await query.get<{ id: number }[]>();
          const idsToUnblock = entitiesToUnblock.map((e) => e.id);
          this.logger.info(`[${config.table}] Unblocking ${idsToUnblock.length} entities (${diff} slots available)`);

          if (idsToUnblock.length > 0) {
            await Query.table(config.table)
              .whereIn('id', idsToUnblock)
              .update(['blocked_at'], [null]);
          }
        }
      }


      return { success: true };
    } catch (error) {
      const isError = error instanceof Error;
      this.logger
        .channel('plan-subscriptions/error')
        .error(
          `Failed to process subscription changes - ${isError ? error.message : 'Unknown error'}`,
          isError ? error : undefined,
        );
      throw error;
    }
  }
}
