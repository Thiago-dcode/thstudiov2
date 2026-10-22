import {
    ACCOUNT_DELETION_QUEUE,
    AI_MEDIA_QUEUE,
    AI_QUEUE,
    BACKUP_QUEUE,
    EMAIL_PREFERENCES_QUEUE,
    JOB_COMPUTE_USER_METRICS,
    JOB_DATABASE_BACKUP,
    JOB_DELETE_USER_ACCOUNT,
    JOB_SEND_ACCOUNT_DELETION_WARNING,
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
    JOB_SEND_WAIT_LIST_VALIDATED_EMAIL,
    JOB_PROCESS_MEDIA,
    JOB_REGENERATE_MEDIA_THUMBNAIL,
    JOB_SET_VIDEO_THUMBNAIL,
    JOB_DELETE_REPLACED_MEDIA_OBJECT,
    JOB_INVALIDATE_MEDIA_SEO_CACHE,
    JOB_UPDATE_MEDIA,
    JOB_UPDATE_PROFILE_STATUS,
    JOB_RECORD_LLM_USAGE,
    JOB_RECORD_MEDIA_MODERATION,
    JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL,
    LOCATION_QUEUE,
    MAIL_QUEUE,
    MEDIA_QUEUE,
    MEDIA_THUMBNAIL_QUEUE,
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
import {
    CreateWaitListJobInput,
    InviteWaitListBatchJobInput,
    SendWaitListValidatedEmailJobInput,
} from '@repo/common-lib/types/wait-list';
import { CreateOrUpdateLocationPayload } from '@repo/common-lib/types/location';
import { CreateUserStorageRequestInput } from '@repo/common-lib/types/user-storage-request';
import { CreateOrUpdateEmailPreferencePayload } from '@repo/common-lib/types/email-preferences';
import { CreateUserNotificationInput } from '@repo/common-lib/types/user-notification';
import { UpdateProfileStatusJobInput } from '@repo/common-lib/types/profile-status';
import { MailJob } from '@repo/common-lib/types/mail';
import { AccountDeletionJobInput } from '@repo/common-lib/types/user';
import {
    DeleteReplacedMediaObjectJobInput,
    InvalidateMediaSeoCacheJobInput,
    MediaJobDto,
    RegenerateMediaThumbnailJobInput,
    SetVideoThumbnailJobInput,
    UpdateMediaJobInput,
} from '@repo/common-lib/types/media';
import { JobsOptions, Queue, QueueEvents } from "bullmq";
import { randomUUID } from 'node:crypto';

/**
 * BullMQ silently drops an `add` whose jobId already exists. `Date.now()` alone collides for jobs
 * added in the same millisecond (one upload records every stored object in one `Promise.all`), so
 * every job that must not be merged with a twin gets a random part too.
 */
const uniqueJobSuffix = () => `${Date.now()}-${randomUUID()}`;

/**
 * How long a single-entity SEO job waits before running. Acts as a debounce window: repeated triggers
 * for the same entity within it collapse into one generation.
 */
export const SINGLE_ENTITY_METADATA_DEBOUNCE_MS = 60_000;

export class QueueHelper {

    /**
     * Hard-deletes an account past its grace period. Deterministic per user so the daily task can
     * never queue two deletions of the same account; `removeOnFail` so a failed run is retried by
     * the next day's task instead of being blocked by the dead job id.
     */
    static async createDeleteUserAccountJob(dto: AccountDeletionJobInput) {
        await QueueHelper.createQueue(ACCOUNT_DELETION_QUEUE).add(
            JOB_DELETE_USER_ACCOUNT,
            dto,
            {
                jobId: `delete-user-account-${dto.user_id}`,
                priority: 10,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    /**
     * The "your account will be deleted in 2 days" email. Deterministic per user; the processor's
     * `deletion_warning_sent_at` stamp is what keeps a later re-enqueue from sending it twice.
     */
    static async createAccountDeletionWarningJob(dto: AccountDeletionJobInput) {
        await QueueHelper.createQueue(ACCOUNT_DELETION_QUEUE).add(
            JOB_SEND_ACCOUNT_DELETION_WARNING,
            dto,
            {
                jobId: `account-deletion-warning-${dto.user_id}`,
                priority: 10,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    /** Outside Nest DI: same Redis URL shape as `BullModule.forRootAsync`. */
    static createQueue(name: string): Queue {
        return new Queue(name, { connection: { url: config().redis.url } });
    }

    /**
     * Runs one database backup now and waits for it, resolving with the worker's return value.
     *
     * Queued rather than called directly: only the worker image ships `pg_dump`. Same job name as
     * the daily scheduler, so it goes through the same processor; the unique id keeps it from being
     * merged with a scheduled run. No retries: the caller is watching and can simply run it again.
     * Rejects when the job fails or does not finish within `timeoutMs` (e.g. no worker running).
     */
    static async runDatabaseBackupJob(timeoutMs: number): Promise<unknown> {
        const connection = { url: config().redis.url };
        const queue = new Queue(BACKUP_QUEUE, { connection });
        const events = new QueueEvents(BACKUP_QUEUE, { connection });
        try {
            // Subscribe before adding, so a fast job's "completed" event cannot be missed.
            await events.waitUntilReady();
            const job = await queue.add(JOB_DATABASE_BACKUP, {}, {
                jobId: `database-backup-manual-${uniqueJobSuffix()}`,
                attempts: 1,
                removeOnComplete: 30,
                removeOnFail: 30,
            });
            return await job.waitUntilFinished(events, timeoutMs);
        } finally {
            await events.close();
            await queue.close();
        }
    }

    static async createMailJob(dto: MailJob) {
        await QueueHelper.createQueue(MAIL_QUEUE).add(
            dto.name,
            dto.payload,
            {
                jobId: `mail-${dto.name}-${uniqueJobSuffix()}`,
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
                jobId: `llm-usage-${dto.user_id}-${uniqueJobSuffix()}`,
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
                jobId: `moderation-${dto.user_id}-${uniqueJobSuffix()}`,
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
                jobId: `contact-${dto.user_id}-${uniqueJobSuffix()}`,
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

    /**
     * Deterministic per entry: concurrent validations of the same token (the validation page is
     * server-rendered several times per visit) collapse into one pending job. `removeOnFail` so a
     * failed job doesn't block a later enqueue; the processor's `validated_email_sent_at` check is
     * what keeps a re-enqueue after completion from sending twice.
     */
    static async createWaitListValidatedEmailJob(dto: SendWaitListValidatedEmailJobInput) {
        await QueueHelper.createQueue(WAIT_LIST_QUEUE).add(
            JOB_SEND_WAIT_LIST_VALIDATED_EMAIL,
            dto,
            {
                jobId: `wait-list-validated-${dto.wait_list_id}`,
                priority: 10,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        );
    }

    static async createInviteWaitListBatchJob(dto: InviteWaitListBatchJobInput) {
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
                jobId: `location-${uniqueJobSuffix()}`,
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
                jobId: `storage-${dto.user_id}-${uniqueJobSuffix()}`,
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
                jobId: `email-preference-${dto.email}-${uniqueJobSuffix()}`,
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

    /**
     * Re-encodes one media's thumbnail at the current thumbnail settings. Deduped per media.
     *
     * Its own queue rather than `MEDIA_QUEUE`: the worker caps this one at a global concurrency
     * of 1, so a backfill over a whole user runs strictly one thumbnail after another (across
     * every worker instance) and never holds up upload processing.
     */
    static async createRegenerateMediaThumbnailJob(dto: RegenerateMediaThumbnailJobInput) {
        await QueueHelper.createRegenerateMediaThumbnailJobs([dto]);
    }

    /**
     * Bulk form for backfills: ONE queue connection (closed afterwards) for the whole batch,
     * where `createQueue` per job would open a Redis connection per media and never close it.
     */
    static async createRegenerateMediaThumbnailJobs(dtos: RegenerateMediaThumbnailJobInput[]) {
        if (!dtos.length) return;
        const queue = QueueHelper.createQueue(MEDIA_THUMBNAIL_QUEUE);
        try {
            await queue.addBulk(
                dtos.map((dto) => ({
                    name: JOB_REGENERATE_MEDIA_THUMBNAIL,
                    data: dto,
                    opts: {
                        jobId: `regenerate-media-thumbnail-${dto.media_id}`,
                        removeOnComplete: true,
                        removeOnFail: true,
                        attempts: 3,
                        backoff: { type: 'exponential' as const, delay: 1000 },
                    },
                })),
            );
        } finally {
            await queue.close();
        }
    }

    /**
     * Re-extracts a finished video's cover at the second the artist picked.
     *
     * On the thumbnail queue for its global concurrency of 1: two cover changes for the same video
     * can never run side by side and race on `previews[0]`. The id is unique per enqueue, NOT
     * deduped per media — a deterministic id would make BullMQ drop a second pick while the first
     * is still waiting, and the cover would end up at the stale second. FIFO order means the last
     * pick is the one that lands.
     */
    static async createSetVideoThumbnailJob(dto: SetVideoThumbnailJobInput) {
        const queue = QueueHelper.createQueue(MEDIA_THUMBNAIL_QUEUE);
        try {
            await queue.add(JOB_SET_VIDEO_THUMBNAIL, dto, {
                jobId: `set-video-thumbnail-${dto.media_id}-${Date.now()}`,
                removeOnComplete: true,
                removeOnFail: true,
                // Wider than the default: a busy row (an edit, the AI metadata run) is retried
                // rather than raced, and those take tens of seconds. 3+6+12+24+48s ≈ 1.5min.
                attempts: 6,
                backoff: { type: 'exponential', delay: 3000 },
            });
        } finally {
            await queue.close();
        }
    }

    /**
     * Deletes a storage object a media no longer references — LATER, not now. Pages, the SEO
     * metadata cache and the landing cache hold a media's keys for hours; deleting a replaced
     * cover at once breaks every one of them until they refresh. The worker re-checks the row
     * before deleting, so a key that is referenced again by then is left alone.
     */
    static async createDeleteReplacedMediaObjectJob(
        dto: DeleteReplacedMediaObjectJobInput,
        delayMs: number,
    ) {
        const queue = QueueHelper.createQueue(MEDIA_THUMBNAIL_QUEUE);
        try {
            await queue.add(JOB_DELETE_REPLACED_MEDIA_OBJECT, dto, {
                jobId: `delete-replaced-media-object-${dto.media_id}-${uniqueJobSuffix()}`,
                delay: delayMs,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            });
        } finally {
            await queue.close();
        }
    }

    /**
     * Drops a media's cached SEO metadata from a process that has no handle on the API's cache
     * (the worker). Consumed by the API's media processor, which owns that cache.
     */
    static async createInvalidateMediaSeoCacheJob(dto: InvalidateMediaSeoCacheJobInput) {
        const queue = QueueHelper.createQueue(MEDIA_UPDATE_QUEUE);
        try {
            await queue.add(JOB_INVALIDATE_MEDIA_SEO_CACHE, dto, {
                jobId: `invalidate-media-seo-cache-${dto.public_id}-${Date.now()}`,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            });
        } finally {
            await queue.close();
        }
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
