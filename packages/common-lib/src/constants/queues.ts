// ==================== QUEUES (BullMQ) ====================
export const USER_METRICS_QUEUE = 'user-metrics' as const;
export const STRIPE_WEBHOOKS_QUEUE = 'stripe-webhooks' as const;
export const AI_QUEUE = 'ai' as const;
export const STORAGE_REQUESTS_QUEUE = 'storage-requests' as const;
export const USER_CONTACTS_QUEUE = 'user-contacts' as const;
export const LOCATION_QUEUE = 'location' as const;
export const MAIL_QUEUE = 'mail' as const;
export const LOG_QUEUE = 'log' as const;
export const PLAN_SUBSCRIPTIONS_QUEUE = 'plan-subscriptions' as const;
export const WAIT_LIST_QUEUE = 'wait-list' as const;
export const EMAIL_PREFERENCES_QUEUE = 'email-preferences' as const;
export const USER_NOTIFICATIONS_QUEUE = 'user-notifications' as const;

// ==================== JOBS (BullMQ) ====================
export const JOB_COMPUTE_USER_METRICS = 'compute-user-metrics' as const;
export const JOB_STRIPE_WEBHOOK = 'stripe-webhook' as const;
export const JOB_RECORD_LLM_USAGE = 'record-llm-usage' as const;
export const JOB_RECORD_MEDIA_MODERATION = 'record-media-moderation' as const;
export const JOB_GENERATE_ENTITY_METADATA = 'generate-entity-metadata' as const;
export const JOB_GENERATE_SINGLE_ENTITY_METADATA = 'generate-single-entity-metadata' as const;
export const JOB_CREATE_STORAGE_REQUEST = 'create-storage-request' as const;
export const JOB_CREATE_USER_CONTACT = 'create-user-contact' as const;
export const JOB_CREATE_OR_UPDATE_LOCATION = 'create-or-update-location' as const;
export const JOB_CREATE_OR_UPDATE_USER_NOTIFICATION = 'create-or-update-user-notification' as const;
export const JOB_SEND_MAIL = 'send-mail' as const;
export const JOB_SEND_BATCH_EMAIL = 'send-batch-email' as const;
export const JOB_FLUSH_LOGS = 'flush-logs' as const;
export const JOB_ON_SUBSCRIPTION_CHANGES = 'on-subscription-changes' as const;
export const JOB_CREATE_WAIT_LIST_ENTRY = 'create-wait-list-entry' as const;
export const JOB_INVITE_WAIT_LIST_BATCH = 'invite-wait-list-batch' as const;

export const JOB_UPSERT_EMAIL_PREFERENCE_BY_EMAIL = 'upsert-email-preference-by-email' as const;
