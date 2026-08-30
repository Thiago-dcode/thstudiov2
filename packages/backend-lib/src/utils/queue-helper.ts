import {
    AI_MEDIA_QUEUE,
    AI_QUEUE,
    EMAIL_PREFERENCES_QUEUE,
    JOB_COMPUTE_USER_METRICS,
    JOB_CREATE_OR_UPDATE_LOCATION,
    JOB_CREATE_OR_UPDATE_USER_NOTIFICATION,
    JOB_CREATE_STORAGE_REQUEST,
    JOB_CREATE_USER_CONTACT,
    JOB_CREATE_WAIT_LIST_ENTRY,
    JOB_GENERATE_ENTITY_METADATA,
    JOB_GENERATE_MEDIA_METADATA,
    JOB_GENERATE_MEDIA_METADATA_AND_NOTIFY,
    JOB_GENERATE_SINGLE_ENTITY_METADATA,
    JOB_INVITE_WAIT_LIST_BATCH,
    JOB_PROCESS_MEDIA,
    JOB_UPDATE_MEDIA,
    JOB_UPDATE_PROFILE_STATUS,
    JOB_RECORD_LLM_USAGE,
    JOB_RECORD_MEDIA_MODERATION,
    JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL,
    LOCATION_QUEUE,
    MAIL_QUEUE,
    MEDIA_QUEUE,
    MEDIA_UPDATE_QUEUE,
    STORAGE_REQUESTS_QUEUE,
    USER_CONTACTS_QUEUE,
    USER_METRICS_QUEUE,
    USER_NOTIFICATIONS_QUEUE,
    PROFILE_STATUS_QUEUE,
    WAIT_LIST_QUEUE,
} from '@repo/common-lib/constants/queues';
import { config } from '@repo/common-lib/config';
import { CreateMediaModerationInput } from '@repo/common-lib/types/media-moderation';
import {
    GenerateEntityMetadataPayload,
    GenerateMediaMetadataInput,
    GenerateSingleEntityMetadataPayload,
} from '@repo/common-lib/types/ai';
import { CreateLlmTokensUsageInput } from '@repo/common-lib/types/llm-tokens-usage';
import { CreateUserContactInput } from '@repo/common-lib/types/user-contact';
import { CreateWaitListJobInput } from '@repo/common-lib/types/wait-list';
import { CreateOrUpdateLocationPayload } from '@repo/common-lib/types/location';
import { CreateUserStorageRequestInput } from '@repo/common-lib/types/user-storage-request';
import { CreateOrUpdateEmailPreferencePayload } from '@repo/common-lib/types/email-preferences';
import { CreateUserNotificationInput } from '@repo/common-lib/types/user-notification';
import { UpdateProfileStatusJobInput } from '@repo/common-lib/types/profile-status';
import { MailJob } from '@repo/common-lib/types/mail';
import { MediaJobDto, UpdateMediaJobInput } from '@repo/common-lib/types/media';
import { JobsOptions, Queue } from "bullmq";

/**
 * How long a single-entity SEO job waits before running. Acts as a debounce window: repeated triggers
 * for the same entity within it collapse into one generation.
 */
export const SINGLE_ENTITY_METADATA_DEBOUNCE_MS = 60_000;

export class QueueHelper {

    /** Outside Nest DI: same Redis URL shape as `BullModule.forRootAsync`. */
    static createQueue(name: string): Queue {
        return new Queue(name, { connection: { url: config().redis.url } });
    }

    static async createMailJob(dto: MailJob) {
        await QueueHelper.createQueue(MAIL_QUEUE).add(
            dto.name,
            dto.payload,
            {
                jobId: `mail-${dto.name}-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createLlmUsageJob(dto: CreateLlmTokensUsageInput) {
        await QueueHelper.createQueue(AI_QUEUE).add(
            JOB_RECORD_LLM_USAGE,
            dto,
            {
                jobId: `llm-usage-${dto.user_id}-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createMediaModerationJob(dto: CreateMediaModerationInput) {
        await QueueHelper.createQueue(AI_QUEUE).add(
            JOB_RECORD_MEDIA_MODERATION,
            dto,
            {
                jobId: `moderation-${dto.user_id}-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createGenerateEntityMetadataJob(dto: GenerateEntityMetadataPayload) {
        await QueueHelper.createQueue(AI_QUEUE).add(
            JOB_GENERATE_ENTITY_METADATA,
            dto,
            {
                jobId: `entity-metadata-${dto.entity}-${Date.now()}`,
                priority: 20,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    /**
     * Enqueue SEO generation for one entity. The jobId is deterministic (no timestamp) so bursts
     * targeting the same entity collapse into one generation: BullMQ drops an add whose id is
     * already queued. Pass `{ delay }` for the event debounce window; omit it for the nightly sweep.
     */
    static async createGenerateSingleEntityMetadataJob(
        dto: GenerateSingleEntityMetadataPayload,
        jobOptions?: JobsOptions,
    ) {
        await QueueHelper.createQueue(AI_QUEUE).add(
            JOB_GENERATE_SINGLE_ENTITY_METADATA,
            dto,
            {
                jobId: `single-entity-metadata-${dto.entity}-${dto.id}`,
                priority: 20,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                ...jobOptions,
            },
        );
    }

    /**
     * Enqueue SEO generation for one media. The jobId is deterministic (no timestamp) so
     * double-clicks collapse into one generation. removeOnFail so a failed job does not
     * block a later retry.
     */
    static async createGenerateMediaMetadataJob(dto: GenerateMediaMetadataInput) {
        await QueueHelper.createQueue(AI_MEDIA_QUEUE).add(
            JOB_GENERATE_MEDIA_METADATA,
            dto,
            {
                jobId: `generate-media-metadata-${dto.media_id}`,
                priority: 10,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    /**
     * Enqueue status update + notification + generate-media-metadata job. Deterministic jobId so
     * double-clicks collapse. removeOnFail so a failed job does not block a later retry.
     */
    static async createGenerateMediaMetadataAndNotifyJob(dto: GenerateMediaMetadataInput) {
        await QueueHelper.createQueue(AI_MEDIA_QUEUE).add(
            JOB_GENERATE_MEDIA_METADATA_AND_NOTIFY,
            dto,
            {
                jobId: `generate-media-metadata-and-notify-${dto.media_id}`,
                priority: 10,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createUserContactJob(dto: CreateUserContactInput) {
        await QueueHelper.createQueue(USER_CONTACTS_QUEUE).add(
            JOB_CREATE_USER_CONTACT,
            dto,
            {
                jobId: `contact-${dto.user_id}-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createWaitListEntryJob(dto: CreateWaitListJobInput) {
        await QueueHelper.createQueue(WAIT_LIST_QUEUE).add(
            JOB_CREATE_WAIT_LIST_ENTRY,
            dto,
            {
                jobId: `wait-list-create-${encodeURIComponent(dto.email.trim().toLowerCase())}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createInviteWaitListBatchJob(dto: { count: number }) {
        await QueueHelper.createQueue(WAIT_LIST_QUEUE).add(
            JOB_INVITE_WAIT_LIST_BATCH,
            dto,
            {
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    /**
     * Deliberately NOT deduplicated by `{type}-{entity_id}`: an entity's lifecycle emits the same
     * pair twice in quick succession (`updateAsync` queues `UPDATING`, then the update processor
     * queues `COMPLETED` milliseconds later), and BullMQ silently drops an `add` whose jobId is
     * already waiting or active. Losing the second one strands the card mid-flight forever — the
     * client has no polling or timeout to fall back on.
     *
     * Duplicates are harmless in return: the processor upserts the row by `(type, entity_id)` and
     * `getPayload` re-reads the entity, so each run emits current state.
     */
    static async createOrUpdateUserNotificationJob(dto: CreateUserNotificationInput) {
        await QueueHelper.createQueue(USER_NOTIFICATIONS_QUEUE).add(
            JOB_CREATE_OR_UPDATE_USER_NOTIFICATION,
            dto,
            {
                jobId: `user-notification-${dto.type}-${dto.entity_id}-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createOrUpdateLocationJob(dto: CreateOrUpdateLocationPayload) {
        await QueueHelper.createQueue(LOCATION_QUEUE).add(
            JOB_CREATE_OR_UPDATE_LOCATION,
            dto,
            {
                jobId: `location-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createStorageRequestJob(dto: CreateUserStorageRequestInput) {
        await QueueHelper.createQueue(STORAGE_REQUESTS_QUEUE).add(
            JOB_CREATE_STORAGE_REQUEST,
            dto,
            {
                jobId: `storage-${dto.user_id}-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createOrUpdateEmailPreferenceJob(dto: CreateOrUpdateEmailPreferencePayload) {
        await QueueHelper.createQueue(EMAIL_PREFERENCES_QUEUE).add(
            JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL,
            dto,
            {
                jobId: `email-preference-${dto.email}-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createComputeUserMetricsJob(userId: number) {
        await QueueHelper.createQueue(USER_METRICS_QUEUE).add(
            JOB_COMPUTE_USER_METRICS,
            { userId },
            {
                jobId: `metrics-${userId}-${Date.now()}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createProcessMediaJob(dto:MediaJobDto) {
        await QueueHelper.createQueue(MEDIA_QUEUE).add(
            JOB_PROCESS_MEDIA,
            dto,
            {
                jobId: `process-media-${dto.media.id}`,
                priority: 10,
                removeOnComplete: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createUpdateMediaJob(dto: UpdateMediaJobInput) {
        await QueueHelper.createQueue(MEDIA_UPDATE_QUEUE).add(
            JOB_UPDATE_MEDIA,
            dto,
            {
                jobId: `update-media-${dto.media_id}`,
                priority: 10,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createUpdateProfileStatusJob(dto: UpdateProfileStatusJobInput) {
        const fieldKeys = Object.keys(dto.fields).sort().join('-');
        await QueueHelper.createQueue(PROFILE_STATUS_QUEUE).add(
            JOB_UPDATE_PROFILE_STATUS,
            dto,
            {
                jobId: `profile-status-${dto.user_id}-${fieldKeys}`,
                priority: 10,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }
}
