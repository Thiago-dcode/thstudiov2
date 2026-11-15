import { Processor } from '@nestjs/bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { LogService, addLogCorrelation, currentJobAttempt } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import {
  JOB_ON_SUBSCRIPTION_CHANGES,
  PLAN_SUBSCRIPTIONS_QUEUE,
} from '@repo/common-lib/constants/queues';
import {
  CACHE_KEY_ACTIVE_PLAN,
  CACHE_KEY_ACTIVE_SUBSCRIPTION,
  CACHE_KEY_USER_EXTRA_DATA,
} from '@repo/common-lib/constants/cache';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { BaseUser } from '@repo/common-lib/types/user';
import { Media } from '@repo/common-lib/types/media';
import { MediaHelper } from '@repo/common-lib/utils/media';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';
import { PlansService } from '../plans/plans.service';
import { Query } from '@repo/database/facades';
import { TableName } from '@repo/common-lib/types/database';
import { Helpers } from 'src/common/services/helpers.service';
import { serviceCacheKeys } from '../user-services/user-service.service';
import { SubscriptionChangedMail } from './mails/subscription-changed.mail';
import { ARTIST_PUBLIC_PAGES_CHANGED_EVENT } from '@repo/common-lib/constants/events';
import { ArtistPublicPagesChangedEvent } from '../edge-cache/events/artist-public-pages-changed.event';

/** Job payload enriched by the webhook processor with the previous plan's identity, used to detect upgrade vs downgrade. */
export type SubscriptionChangesJobData = BaseUser & {
  prevPlanId: number | null;
  prevPlanName: string | null;
  prevPlanBasePrice: number | null;
};

/** Everything {@link MediaHelper.storageBytes} needs, and nothing else, per media row. */
const MEDIA_STORAGE_COLUMNS = [
  'id',
  'bytes',
  'thumbnail_bytes',
  'previews_bytes',
  'video_preview_bytes',
] satisfies (keyof Media)[];

type MediaStorageRow = Pick<Media, (typeof MEDIA_STORAGE_COLUMNS)[number]>;

/** Rows an UPDATE touched. A driver result without a count is assumed to have changed some. */
const rowsChanged = (result: unknown): boolean => {
  const rowCount = (result as { rowCount?: unknown } | null)?.rowCount;
  return typeof rowCount === 'number' ? rowCount > 0 : true;
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
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  // ==================== JOB PROCESSOR ====================

  async process(job: Job): Promise<any> {
    // Start/finish lines and the trace come from GlobalProcessor; the module config names the op.
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
    const { id: userId } = data;
    try {
      // Never `data` itself: it is the user row (name, email, ...).
      addLogCorrelation({ user_id: userId });
      this.logger.info('Processing subscription changes', { prev_plan_id: data.prevPlanId ?? null });
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
      this.logger.info('Storage diff computed', {
        over_limit_mb: overLimitMb,
        limit_mb: currentPlan.storage_limit_mb,
        used_mb: userExtraData.storage_used_mb,
      });

      const blockedMediaResult = await Query.table('media')
        .rawSelect(`COALESCE(SUM(${MediaHelper.storageBytesSql}), 0) as blocked_bytes`)
        .where('blocked_at', '!=', null)
        .where('user_id', '=', userId)
        .first<{ blocked_bytes: string }>();
      const currentBlockedMb = parseInt(blockedMediaResult.blocked_bytes) / (1024 * 1024);

      const haveToBeBlockedMb = overLimitMb;
      const diffBlockedMb = haveToBeBlockedMb - currentBlockedMb;

      // Whether any media or entity was blocked or unblocked: only then do the public pages change.
      let blockingChanged = false;

      this.logger.info('Media block target computed', {
        blocked_mb: Number(currentBlockedMb.toFixed(2)),
        target_blocked_mb: Number(Math.max(0, haveToBeBlockedMb).toFixed(2)),
      });

      if (haveToBeBlockedMb <= 0) {
        if (currentBlockedMb > 0) {
          this.logger.info('Unblocking all blocked media (user is within storage limit)');
          const result = await Query.table('media')
            .where('blocked_at', '!=', null)
            .where('user_id', '=', userId)
            .update(['blocked_at'], [null]);
          blockingChanged ||= rowsChanged(result);
        }
      } else if (diffBlockedMb > 0) {
        let remainingToBlockMb = diffBlockedMb;
        const unblocked = await Query.table('media')
          .select(MEDIA_STORAGE_COLUMNS)
          .where('blocked_at', null)
          .where('user_id', '=', userId)
          .orderBy('is_active', 'ASC')
          .orderBy('updated_at', 'ASC')
          .get<MediaStorageRow[]>();

        const mediaIdsToBlock: number[] = [];
        for (const item of unblocked) {
          if (remainingToBlockMb <= 0) break;
          const itemMb = MediaHelper.storageBytes(item) / (1024 * 1024);
          remainingToBlockMb -= itemMb;
          mediaIdsToBlock.push(item.id);
        }

        this.logger.info('Blocking media', { count: mediaIdsToBlock.length, to_free_mb: Number(diffBlockedMb.toFixed(2)) });
        if (mediaIdsToBlock.length > 0) {
          const result = await Query.table('media')
            .whereIn('id', mediaIdsToBlock)
            .update(['blocked_at'], [new Date()]);
          blockingChanged ||= rowsChanged(result);
        }
      } else if (diffBlockedMb < 0) {
        let remainingToUnblockMb = Math.abs(diffBlockedMb);
        const blocked = await Query.table('media')
          .select(MEDIA_STORAGE_COLUMNS)
          .where('blocked_at', '!=', null)
          .where('user_id', '=', userId)
          .orderBy('is_active', 'DESC')
          .orderBy('updated_at', 'DESC')
          .get<MediaStorageRow[]>();

        const mediaIdsToUnblock: number[] = [];
        for (const item of blocked) {
          const itemMb = MediaHelper.storageBytes(item) / (1024 * 1024);
          if (itemMb <= remainingToUnblockMb) {
            remainingToUnblockMb -= itemMb;
            mediaIdsToUnblock.push(item.id);
          }
        }

        this.logger.info('Unblocking media', { count: mediaIdsToUnblock.length, over_blocked_mb: Number(Math.abs(diffBlockedMb).toFixed(2)) });
        if (mediaIdsToUnblock.length > 0) {
          const result = await Query.table('media')
            .whereIn('id', mediaIdsToUnblock)
            .update(['blocked_at'], [null]);
          blockingChanged ||= rowsChanged(result);
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

        this.logger.info('Entity limit diff computed', {
          table: config.table,
          to_block: haveToBeBlocked,
          limit: config.maxLimit,
          current: config.currentCount,
        });

        //-1 mean not limits
        if (haveToBeBlocked <= 0 || config.maxLimit === -1) {
          if (currentBlocked > 0) {
            blockingChanged ||= rowsChanged(await query.update(['blocked_at'], [null], false));
          }
        } else {
          const amountToUnblock = currentBlocked - haveToBeBlocked;
          if (amountToUnblock > 0) {
            blockingChanged ||= rowsChanged(
              await query.limit(amountToUnblock).update(['blocked_at'], [null], false),
            );
          } else if (amountToUnblock < 0) {
            const toBlock = Math.abs(amountToUnblock);

            const blockQuery = Query.table(config.table as any).softDeletes(true)
              .where('blocked_at', null)
              .where('user_id', '=', userId);
            if (config.activeColumn) {
              blockQuery.orderBy(config.activeColumn, 'ASC');
            }
            blockQuery.orderBy('updated_at', 'ASC').limit(toBlock);

            blockingChanged ||= rowsChanged(await blockQuery.update(['blocked_at'], [new Date()]));
          }
        }
      }

      await this.helpers.deleteManyCached([
        CACHE_KEY_USER_EXTRA_DATA(userId),
        CACHE_KEY_ACTIVE_PLAN(userId),
        CACHE_KEY_ACTIVE_SUBSCRIPTION(userId),
        serviceCacheKeys.allByUser(userId),
      ]);
      if (blockingChanged) {
        this.eventEmitter.emit(
          ARTIST_PUBLIC_PAGES_CHANGED_EVENT,
          new ArtistPublicPagesChangedEvent(userId),
        );
      }

      // Stripe also sends subscription updates that keep the same plan (cancel at
      // period end, renewals, payment method changes): no plan change, no email.
      if (data.prevPlanId === currentPlan.id) {
        this.logger.info('Plan unchanged; skipping subscription-changed email', { plan_id: currentPlan.id });
        return { success: true };
      }

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
          data.language,
        ),
      );

      return { success: true };
    } catch (error) {
      const failure = {
        error_name: error instanceof Error ? error.name : typeof error,
        error_message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
      // Retries of a transient failure are not a human-now event; the last one is.
      if (currentJobAttempt()?.is_final) {
        this.logger.critical('Subscription change processing failed permanently', { ...failure, will_retry: false });
      } else {
        this.logger.error('Subscription change processing failed', { ...failure, will_retry: true });
      }
      throw error;
    }
  }
}
