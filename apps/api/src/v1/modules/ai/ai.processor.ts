import { Processor } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LlmTokensUsageRepository } from './llm-tokens-usage.repository';
import { MediaModerationRepository } from './media-moderation.repository';
import { LlmTokensUsageEvent } from './events/llm-tokens-usage.event';
import { MediaModerationEvent } from './events/media-moderation.event';
import { GenerateEntityMetadataEvent } from './events/generate-entity-metadata.event';
import { GenerateSingleEntityMetadataEvent } from './events/generate-single-entity-metadata.event';
import { AiService } from './ai.service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { UpdateUserExtraDataMetricsEvent } from '../user-extra-data/events/update-user-extra-data-metrics.event';
import { UserAiCreditsEndedMail } from '../user-extra-data/mails/user-metrics-ended';
import { UserAccountBannedMail } from '../users/mails/user-account-banned.mail';
import { UserService } from '../users/users.service';
import { PlanSubscriptionsService } from '../plan-subscriptions/plan-subscriptions.service';
import { PortfolioRepository } from '../portfolios/portfolio.repository';
import { CollectionRepository } from '../collections/collection.repository';
import { ServiceRepository } from '../services/service.repository';
import { UserRepository } from '../users/users.repository';

import { CreateLlmTokensUsageInput } from '@repo/common-lib/types/llm-tokens-usage';
import { CreateMediaModerationInput } from '@repo/common-lib/types/media-moderation';
import {
  EntitySeoFields,
  GenerateEntityMetadataPayload,
  GenerateSingleEntityMetadataPayload,
  SeoTranslation,
} from '@repo/common-lib/types/ai';
import { UserProfile } from '@repo/common-lib/types/user';
import {
  AI_QUEUE,
  JOB_RECORD_LLM_USAGE,
  JOB_RECORD_MEDIA_MODERATION,
  JOB_GENERATE_ENTITY_METADATA,
  JOB_GENERATE_SINGLE_ENTITY_METADATA,
  LLM_TOKENS_USAGE_EVENT,
  STRIKES_TO_BAN,
  BAN_DURATION_DAYS,
  PERMANENT_BAN_THRESHOLD,
  MEDIA_MODERATION_EVENT,
  GENERATE_ENTITY_METADATA_EVENT,
  GENERATE_SINGLE_ENTITY_METADATA_EVENT,
  UPDATE_USER_EXTRA_DATA_METRICS,
  CREDIT_CONSUMING_LLM_USAGE_TYPES,
  CACHE_KEY_PORTFOLIO_SEO,
  CACHE_KEY_COLLECTION_SEO,
  CACHE_KEY_SERVICE_SEO,
} from '@repo/common-lib/constants/constants';
import { Helpers } from 'src/common/services/helpers.service';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';

/**
 * How long a single-entity SEO job waits before running. Acts as a debounce window: repeated triggers
 * for the same entity within it collapse into one generation (see `handleGenerateSingleEntityMetadataEvent`).
 */
const SINGLE_ENTITY_METADATA_DEBOUNCE_MS = 60_000;

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
    private readonly aiService: AiService,
    private readonly helpers: Helpers,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly userRepository: UserRepository,
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

  /** Listen for entity metadata generation cron events and enqueue them */
  @OnEvent(GENERATE_ENTITY_METADATA_EVENT)
  async handleGenerateEntityMetadataEvent(event: GenerateEntityMetadataEvent) {
    await this.aiQueue.add(
      JOB_GENERATE_ENTITY_METADATA,
      event.payload,
      {
        jobId: `entity-metadata-${event.payload.entity}-${Date.now()}`,
        priority: 20,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  /**
   * Listen for single-entity metadata events and enqueue them.
   *
   * The jobId is deterministic (no timestamp) and the job is delayed, so bursts targeting the same
   * entity collapse into ONE generation: BullMQ drops an add whose id is already queued. This matters
   * because a single user action fans out — running AI on ten images in a portfolio emits ten refresh
   * events for that same portfolio, and each one would otherwise be a separate billed LLM call. The
   * delay is the coalescing window; the job re-reads the entity when it finally runs, so it always
   * sees the final state. `removeOnFail` keeps a permanently failing entity from wedging its own id.
   */
  @OnEvent(GENERATE_SINGLE_ENTITY_METADATA_EVENT)
  async handleGenerateSingleEntityMetadataEvent(event: GenerateSingleEntityMetadataEvent) {
    await this.aiQueue.add(
      JOB_GENERATE_SINGLE_ENTITY_METADATA,
      event.payload,
      {
        jobId: `single-entity-metadata-${event.payload.entity}-${event.payload.id}`,
        delay: SINGLE_ENTITY_METADATA_DEBOUNCE_MS,
        priority: 20,
        removeOnComplete: true,
        removeOnFail: true,
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
        case JOB_GENERATE_ENTITY_METADATA:
          return await this.generateDueEntityMetadata(job.data);
        case JOB_GENERATE_SINGLE_ENTITY_METADATA:
          return await this.generateSingleEntityMetadata(job.data);
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

      // Only user-initiated, credit-consuming usage can exhaust credits / trigger the email.
      // Platform-driven background SEO (portfolio/collection/service/user metadata) is excluded,
      // otherwise a user sitting one credit below their limit would be emailed every cron run.
      const isCreditConsuming = CREDIT_CONSUMING_LLM_USAGE_TYPES.includes(usageData.usage_type);
      const creditsExhausted =
        isCreditConsuming &&
        (await this.userExtraDataService.checkAiCreditsExhausted(usageData.user_id, 1));

      if (creditsExhausted) {
        try {
          const user = await this.userService.findOneCompacted(usageData.user_id);
          if (user) {
            await this.mailService.send(
              this.userAiCreditsEndedMail.setUser(user, user.language),
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
    const log = this.logger.name('moderate-content');
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
              this.userAccountBannedMail.setUser(user, user.language),
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

  /** Batch job: find due rows for an entity type and generate metadata for each inline. */
  private async generateDueEntityMetadata(payload: GenerateEntityMetadataPayload) {
    const log = this.logger.name(`batch-${payload.entity}-metadata`);

    let dueRows: { id: number; user_id: number }[] = [];
    switch (payload.entity) {
      case 'portfolio':
        dueRows = await this.portfolioRepository.findDueForSeoGeneration();
        break;
      case 'collection':
        dueRows = await this.collectionRepository.findDueForSeoGeneration();
        break;
      case 'service':
        dueRows = await this.serviceRepository.findDueForSeoGeneration();
        break;
      case 'user':
        dueRows = await this.userRepository.findDueForSeoGeneration();
        break;
      default: {
        const exhaustive: never = payload.entity;
        throw new Error(`Unknown entity metadata type: ${exhaustive}`);
      }
    }

    if (!dueRows.length) {
      log.info(`No ${payload.entity}s due for metadata generation`);
      return { processed: 0, failed: 0 };
    }

    log.info(`Found ${dueRows.length} ${payload.entity}(s) due for metadata generation`);

    // Fan out: enqueue one job per due row so each entity is retried/backed-off independently
    // instead of processing the whole table sequentially inside this single (potentially hours-long) job.
    for (const row of dueRows) {
      await this.aiQueue.add(
        JOB_GENERATE_SINGLE_ENTITY_METADATA,
        { entity: payload.entity, id: row.id, user_id: row.user_id },
        {
          // Same deterministic id as the event path, so a nightly sweep never duplicates a refresh
          // that a recent edit or media generation already queued for this entity.
          jobId: `single-entity-metadata-${payload.entity}-${row.id}`,
          priority: 20,
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      );
    }

    log.info(`Enqueued ${dueRows.length} ${payload.entity} metadata job(s)`);
    return { enqueued: dueRows.length };
  }

  /** Single-entity job: generate + persist SEO for one portfolio/collection/service/user. */
  private async generateSingleEntityMetadata(
    payload: GenerateSingleEntityMetadataPayload,
    log: LogService = this.logger.name(`single-${payload.entity}-metadata`),
  ) {
    const { entity, id, user_id } = payload;

    try {
      switch (entity) {
        case 'portfolio': {
          const portfolio = await this.portfolioRepository.getFullById(id);
          if (!portfolio) {
            log.warn(`Portfolio [${id}] not found, skipping`);
            return { skipped: true };
          }
          const artist = this.buildArtistContext(await this.userRepository.getUserProfileById(user_id));
          const { translations } = await this.aiService.generatePortfolioMetadata(portfolio, artist, {
            portfolio_id: id,
            user_id,
          });
          if (!this.hasSeo(translations)) {
            log.warn(`No metadata generated for portfolio [${id}], leaving unstamped to retry next run`);
            return { skipped: true };
          }
          await this.portfolioRepository.updateSeoById(id, this.enFallback(translations));
          await this.portfolioRepository.upsertSeoTranslations(id, translations);
          await this.helpers.deleteCached(CACHE_KEY_PORTFOLIO_SEO(user_id, portfolio.slug), {
            appended_language: true,
          });
          break;
        }
        case 'collection': {
          const collection = await this.collectionRepository.getFullById(id);
          if (!collection) {
            log.warn(`Collection [${id}] not found, skipping`);
            return { skipped: true };
          }
          const artist = this.buildArtistContext(await this.userRepository.getUserProfileById(user_id));
          const { translations } = await this.aiService.generateCollectionMetadata(collection, artist, {
            collection_id: id,
            user_id,
          });
          if (!this.hasSeo(translations)) {
            log.warn(`No metadata generated for collection [${id}], leaving unstamped to retry next run`);
            return { skipped: true };
          }
          await this.collectionRepository.updateSeoById(id, this.enFallback(translations));
          await this.collectionRepository.upsertSeoTranslations(id, translations);
          await this.helpers.deleteCached(CACHE_KEY_COLLECTION_SEO(user_id, collection.slug), {
            appended_language: true,
          });
          break;
        }
        case 'service': {
          const service = await this.serviceRepository.getFullById(id);
          if (!service) {
            log.warn(`Service [${id}] not found, skipping`);
            return { skipped: true };
          }
          const artist = this.buildArtistContext(await this.userRepository.getUserProfileById(user_id));
          const { translations } = await this.aiService.generateServiceMetadata(service, artist, {
            service_id: id,
            user_id,
          });
          if (!this.hasSeo(translations)) {
            log.warn(`No metadata generated for service [${id}], leaving unstamped to retry next run`);
            return { skipped: true };
          }
          await this.serviceRepository.updateSeoById(id, this.enFallback(translations));
          await this.serviceRepository.upsertSeoTranslations(id, translations);
          await this.helpers.deleteCached(CACHE_KEY_SERVICE_SEO(user_id, service.slug), {
            appended_language: true,
          });
          break;
        }
        case 'user': {
          const profile = await this.userRepository.getUserProfileById(id);
          if (!profile || !profile.name  || !profile.profession || !profile.short_biography) {
            log.warn(`User profile [${id}] not found or incomplete, skipping`);
            return { skipped: true };
          }
          const { translations } = await this.aiService.generateUserMetadata(profile, { user_id });
          if (!this.hasSeo(translations)) {
            log.warn(`No metadata generated for user [${id}], leaving unstamped to retry next run`);
            return { skipped: true };
          }
          await this.userRepository.updateSeoById(id, this.enFallback(translations));
          await this.userRepository.upsertSeoTranslations(id, translations);
          break;
        }
        default: {
          const exhaustive: never = entity;
          throw new Error(`Unknown entity metadata type: ${exhaustive}`);
        }
      }

      log.info(`Metadata generated for ${entity} [${id}]`);
      return { success: true };
    } catch (error) {
      log.error(
        `Failed to generate metadata for ${entity} [${id}] (user ${user_id}) - ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
      );
      throw error;
    }
  }

  private hasSeo(translations: SeoTranslation[]): boolean {
    return translations.some((t) => !!(t.seo_title || t.seo_description));
  }

  /** Pick the EN row (fallback to first) to persist onto the main-table SEO columns. */
  private enFallback(translations: SeoTranslation[]): EntitySeoFields {
    const en = translations.find((t) => t.language_code === 'EN') ?? translations[0];
    return { seo_title: en?.seo_title ?? null, seo_description: en?.seo_description ?? null };
  }

  /**
   * Minimal artist signals passed to entity SEO generation. Whether the location is actually used is
   * decided per entity inside `AiService` — services/profiles use it, portfolios/collections never do.
   */
  private buildArtistContext(profile: UserProfile | null) {
    return {
      display_name: profile
        ? [profile.name, profile.surname].filter(Boolean).join(' ') || null
        : null,
      profession: profile?.profession ?? null,
      city: profile?.address?.city ?? null,
      region: profile?.address?.state ?? null,
    };
  }
}
