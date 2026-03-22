import { MimeTypes } from "../types/general";

// ==================== LANGUAGE / LOCALIZATION ====================
export const DEFAULT_LANGUAGE = 'EN' as const;
export const LANGUAGE_HEADER = 'x-app-lan' as const;
export const LANGUAGE_COOKIE_NAME = 'x-app-language' as const;

// ==================== REQUEST HEADERS ====================
export const REQUEST_START_TIME = 'x-app-req-start-time' as const;
export const USER_ID_HEADER = 'x-app-user-id' as const;
export const USER_AGENT_HEADER = 'x-app-user-agent' as const;
export const IP_ADDRESS_HEADER = 'x-app-ip-address' as const;
export const APP_API_KEY_HEADER = 'x-app-api-key' as const;

// ==================== AUTH COOKIES ====================
export const USER_AUTH_COOKIE_NAME = 'x-app-token' as const;
export const USER_AUTH_COOKIE_EXPIRATION_DATE = 'x-app-refresh-token-date' as const;
export const TWO_FA_COOKIE_NAME = 'x-app-2fa' as const;
export const REMEMBER_ME_COOKIE_NAME = 'x-app-remember-me' as const;

// ==================== PASSWORD RECOVERY COOKIES ====================
export const PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME = 'x-app-password-recovery-attempt' as const;
export const PASSWORD_UPDATED_COOKIE_NAME = 'x-app-password-updated' as const;

// ==================== SUBSCRIPTION COOKIES ====================
export const INITIATE_SUBCRIPTION_COOKIE = 'x-app-initiate_subscription' as const;

// ==================== APP CONFIGURATION ====================
export const FUNNEL_LAST_STEP = 5;
export const ALLOWED_IMAGE_FILE_TYPES: MimeTypes[] = ['image/jpeg', 'image/png', 'image/webp'];
export const STRIKES_TO_BAN = 3;
export const MAX_USERNAME_RESET = 3;
export const MAX_PASSWORD_RESET = 3;

// Ban duration in days based on ban_count. null = permanent ban.
export const BAN_DURATION_DAYS: Record<number, number | null> = {
  1: 3,    // 3 days
  2: 7,    // 1 week
  3: 14,   // 2 weeks
  4: 30,   // 1 month
};
export const PERMANENT_BAN_THRESHOLD = 5;


// ==================== EVENTS ====================
export const NEW_USER_EVENT = 'new.user' as const;
export const WEBHOOK_STRIPE_EVENT = 'webhook.stripe.event' as const;
export const UPDATE_USER_EXTRA_DATA_METRICS = 'update-user-extra-data-metrics.event' as const;
export const LLM_TOKENS_USAGE_EVENT = 'llm.tokens.usage' as const;
export const MEDIA_MODERATION_EVENT = 'media.moderation' as const;
export const CREATE_USER_STORAGE_REQUEST = 'create.user-storage-request' as const;
export const CREATE_USER_CONTACT = 'create.user-contact' as const;
export const CREATE_OR_UPDATE_LOCATION = 'create-or-update.location' as const;

// ==================== QUEUES (BullMQ) ====================
export const USER_METRICS_QUEUE = 'user-metrics' as const;
export const STRIPE_WEBHOOKS_QUEUE = 'stripe-webhooks' as const;
export const AI_QUEUE = 'ai' as const;
export const STORAGE_REQUESTS_QUEUE = 'storage-requests' as const;
export const USER_CONTACTS_QUEUE = 'user-contacts' as const;
export const LOCATION_QUEUE = 'location' as const;
export const MAIL_QUEUE = 'mail' as const;
export const LOG_QUEUE = 'log' as const;

// ==================== JOBS (BullMQ) ====================
export const JOB_COMPUTE_USER_METRICS = 'compute-user-metrics' as const;
export const JOB_STRIPE_WEBHOOK = 'stripe-webhook' as const;
export const JOB_RECORD_LLM_USAGE = 'record-llm-usage' as const;
export const JOB_RECORD_MEDIA_MODERATION = 'record-media-moderation' as const;
export const JOB_CREATE_STORAGE_REQUEST = 'create-storage-request' as const;
export const JOB_CREATE_USER_CONTACT = 'create-user-contact' as const;
export const JOB_CREATE_OR_UPDATE_LOCATION = 'create-or-update-location' as const;
export const JOB_SEND_MAIL = 'send-mail' as const;
export const JOB_FLUSH_LOGS = 'flush-logs' as const;

// ==================== CACHE KEYS ====================
// Plans
export const CACHE_KEY_PLANS = 'plans' as const;
export const CACHE_KEY_FREE_PLAN = 'free-plan' as const;
export const CACHE_KEY_ACTIVE_PLAN = (userId: number | string) => `active_plan_${userId}` as const;

// Subscriptions
export const CACHE_KEY_ACTIVE_SUBSCRIPTION = (userId: number | string) => `active_subscription_${userId}` as const;

// Categories
export const CACHE_KEY_USER_CATEGORIES = (userId: number | string) => `user_categories_${userId}` as const;
export const CACHE_KEY_USER_PUBLIC_ID = (userId: number | string) => `user_public_id_${userId}` as const;
export const CACHE_KEY_USERNAME_EXISTS = (username: string) => `username_exists_${username}` as const;
