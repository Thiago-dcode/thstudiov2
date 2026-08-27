import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LlmTokensUsageRepository } from './llm-tokens-usage.repository';
import { MediaModerationRepository } from './media-moderation.repository';
import { AiService } from './ai.service';
import { FactoryLogService, LogService } from '@repo/backend-lib/services/log-service';
import { MailService } from '@repo/backend-lib/services/mail-service';
import { QueueHelper } from '@repo/backend-lib/utils';
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
  STRIKES_TO_BAN,
  BAN_DURATION_DAYS,
  PERMANENT_BAN_THRESHOLD,
  CREDIT_CONSUMING_LLM_USAGE_TYPES,
} from '@repo/common-lib/constants/limits';
import {
  AI_QUEUE,
  JOB_RECORD_LLM_USAGE,
  JOB_RECORD_MEDIA_MODERATION,
  JOB_GENERATE_ENTITY_METADATA,
  JOB_GENERATE_SINGLE_ENTITY_METADATA,
} from '@repo/common-lib/constants/queues';
import {
  CACHE_KEY_PORTFOLIO_SEO,
  CACHE_KEY_COLLECTION_SEO,
  CACHE_KEY_SERVICE_SEO,
} from '@repo/common-lib/constants/cache';
import { Helpers } from 'src/common/services/helpers.service';
import { GlobalProcessor } from 'src/common/processors/global.processor';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';

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
    private readonly aiService: AiService,
    private readonly helpers: Helpers,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly collectionRepository: CollectionRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly userRepository: UserRepository,
    private readonly appLogService: LogService,
  ) {
    super();
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

      await QueueHelper.createComputeUserMetricsJob(usageData.user_id);

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

        await QueueHelper.createComputeUserMetricsJob(moderationData.user_id);
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
    // Same deterministic id as the create/update path, so a nightly sweep never duplicates a refresh
    // that a recent edit already queued for this entity. No delay — due rows run immediately.
    for (const row of dueRows) {
      await QueueHelper.createGenerateSingleEntityMetadataJob(
        { entity: payload.entity, id: row.id, user_id: row.user_id },
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
          if (!profile || !profile.name || !profile.profession || !profile.short_biography) {
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
