import {
    JOB_COMPUTE_USER_METRICS,
    JOB_CREATE_OR_UPDATE_LOCATION,
    JOB_CREATE_STORAGE_REQUEST,
    JOB_CREATE_USER_CONTACT,
    JOB_CREATE_WAIT_LIST_ENTRY,
    JOB_GENERATE_ENTITY_METADATA,
    JOB_GENERATE_SINGLE_ENTITY_METADATA,
    JOB_INVITE_WAIT_LIST_BATCH,
    JOB_RECORD_LLM_USAGE,
    JOB_RECORD_MEDIA_MODERATION,
    JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL,
} from '@repo/common-lib/constants/constants';
import { CreateMediaModerationInput } from '@repo/common-lib/types/media-moderation';
import { GenerateEntityMetadataPayload, GenerateSingleEntityMetadataPayload } from '@repo/common-lib/types/ai';
import { CreateLlmTokensUsageInput } from '@repo/common-lib/types/llm-tokens-usage';
import { CreateUserContactInput } from '@repo/common-lib/types/user-contact';
import { CreateWaitListJobInput } from '@repo/common-lib/types/wait-list';
import { CreateOrUpdateLocationPayload } from '@repo/common-lib/types/location';
import { CreateUserStorageRequestInput } from '@repo/common-lib/types/user-storage-request';
import { CreateOrUpdateEmailPreferencePayload } from '@repo/common-lib/types/email-preferences';
import { JobsOptions, Queue } from "bullmq";

/**
 * How long a single-entity SEO job waits before running. Acts as a debounce window: repeated triggers
 * for the same entity within it collapse into one generation.
 */
export const SINGLE_ENTITY_METADATA_DEBOUNCE_MS = 60_000;

export class QueueHelper {

    static async createLlmUsageJob(queue: Queue, dto: CreateLlmTokensUsageInput) {
        await queue.add(
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

    static async createMediaModerationJob(queue: Queue, dto: CreateMediaModerationInput) {
        await queue.add(
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

    static async createGenerateEntityMetadataJob(queue: Queue, dto: GenerateEntityMetadataPayload) {
        await queue.add(
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
        queue: Queue,
        dto: GenerateSingleEntityMetadataPayload,
        jobOptions?: JobsOptions,
    ) {
        await queue.add(
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

    static async createUserContactJob(queue: Queue, dto: CreateUserContactInput) {
        await queue.add(
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

    static async createWaitListEntryJob(queue: Queue, dto: CreateWaitListJobInput) {
        await queue.add(
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

    static async createInviteWaitListBatchJob(queue: Queue, dto: { count: number }) {
        await queue.add(
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

    static async createOrUpdateLocationJob(queue: Queue, dto: CreateOrUpdateLocationPayload) {
        await queue.add(
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

    static async createStorageRequestJob(queue: Queue, dto: CreateUserStorageRequestInput) {
        await queue.add(
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

    static async createOrUpdateEmailPreferenceJob(queue: Queue, dto: CreateOrUpdateEmailPreferencePayload) {
        await queue.add(
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

    static async createComputeUserMetricsJob(queue: Queue, userId: number) {
        await queue.add(
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
}
