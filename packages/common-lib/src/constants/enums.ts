export const ENUMS = {
  FORMAT_TYPE: ['COMPACT', 'FULL'] as const,
  PRODUCT_TYPE: ['PLAN'] as const,
  BILLING_TYPE: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME'] as const,
  USER_EDITORS_ROLES: ['ADMIN', 'EDITOR'] as const,
  USER_ROLE: ['ADMIN', 'SUPPORT', 'CLIENT', 'ARTIST'] as const,
  LANGUAGE_CODE: ['EN', 'ES', 'PT'] as const,
  MEDIA_TYPE: ['IMAGE', 'VIDEO', 'GIF'] as const,
  MEDIA_STATUS: ['UPLOADING', 'UPDATING', 'GENERATING_METADATA', 'COMPLETED', 'FAILED'] as const,
  MEDIA_SHAPE: ['SQUARE', 'LANDSCAPE', 'PORTRAIT'] as const,
  ASPECT_RATIO: [
    '1:1',
    '5:4',
    '4:3',
    '3:2',
    '16:9',
    '21:9',
    '4:5',
    '3:4',
    '2:3',
    '9:16',
  ] as const,
  COMPRESSION_LEVEL: ['VERY_LOW', 'LOW', 'NORMAL', 'HIGH', 'VERY_HIGH'] as const,
  LLM_USAGE_TYPE: [
    'GENERATE_MEDIA_METADATA',
    'GENERATE_MEDIA_TEXT',
    'MODERATE_MEDIA_CONTENT',
    'GENERATE_PORTFOLIO_METADATA',
    'GENERATE_COLLECTION_METADATA',
    'GENERATE_SERVICE_METADATA',
    'GENERATE_USER_METADATA',
  ] as const,
  NOTIFICATION_TYPE: ['NEW_CONTACT', 'CREATE_UPDATE_MEDIA', 'GENERATE_MEDIA_METADATA', 'DELETE_MEDIA', 'FAILED_GENERATE_MEDIA_METADATA'] as const,
  PROJECT_STATUS: [
    'NOT_STARTED',
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'PENDING_PAYMENT',
    'PAUSED',
  ] as const,
  EMAIL_TYPE: ['MARKETING', 'TRANSACTIONAL', 'WAITLIST_UPDATE', 'NOTIFICATION'] as const,
  PAYMENT_METHOD: ['CARD', 'PAYPAL'] as const,
  PLAN_OFFERS_TYPE: ['FREE', 'DISCOUNT'] as const,
  BENEFIT_TYPE: ['EARLY_USER', 'VIP', 'FOUNDER'] as const,
  WAIT_LIST_STATUS: ['WAITING', 'INVITING', 'INVITED', 'REGISTERED', 'EXPIRED', 'REJECTED'] as const,
  LAYOUT_TYPE: ['MASONRY', 'UNIFORM', 'COLUMN_BASE'] as const,
  CATEGORY_TYPE: ['DISCIPLINE', 'ART_STYLE', 'TAGS'] as const,
  PASSWORD_RECOVERY_ATTEMPT_STATUS: ['CODE_NOT_VALIDATED', 'CODE_VALIDATED', 'PASSWORD_CHANGED'],
  STRIPE_ERROR: [
    'StripeCardError',
    'StripeInvalidRequestError',
    'StripeConnectionError',
    'StripeAPIError',
    'StripeAuthenticationError',
    'StripeIdempotencyError',
    'StripePermissionError',
    'StripeRateLimitError',
    'StripeSignatureVerificationError',
  ] as const,
  STRIPE_RAW_ERROR_TYPE: [
    'card_error',
    'invalid_request_error',
    'api_error',
    'idempotency_error',
    'rate_limit_error',
    'authentication_error',
    'invalid_grant',
    'temporary_session_expired',
  ] as const,
};
// TABLES
export const TABLES_ENUM = {
  PLANS: 'plans',
  PLAN_PRICES: 'plan_prices',
  PLAN_TRANSLATIONS: 'plan_translations',
  PLAN_OFFERS: 'plan_offers',
  USER_EXTRA_DATA: 'user_extra_data',
  PROFILE_STATUS: 'profile_status',
  USER_CONTACTS: 'user_contacts',
  USER_NOTIFICATIONS: 'user_notifications',
  ADMIN_USERS: 'admin_users',
  ADMIN_USERS_ROLES: 'admin_users_roles',
  ROLES: 'roles',
  USERS: 'users',
  USER_TRANSLATIONS: 'user_translations',
  CATEGORIES: 'categories',
  USER_CATEGORIES: 'user_categories',
  CATEGORY_TRANSLATIONS: 'category_translations',
  PLAN_SUBSCRIPTIONS: 'plan_subscriptions',
  TRANSACTIONS: 'transactions',
  MIGRATIONS: 'migrations',
  MEDIA: 'media',
  MEDIA_CATEGORIES: 'media_categories',
  MEDIA_TRANSLATIONS: 'media_translations',
  COLLECTIONS: 'collections',
  COLLECTION_CATEGORIES: 'collection_categories',
  COLLECTION_MEDIA: 'collection_media',
  COLLECTION_TRANSLATIONS: 'collection_translations',
  PORTFOLIOS: 'portfolios',
  PORTFOLIO_CATEGORIES: 'portfolio_categories',
  PORTFOLIO_MEDIA: 'portfolio_media',
  PORTFOLIO_COLLECTION: 'portfolio_collection',
  PORTFOLIO_TRANSLATIONS: 'portfolio_translations',
  PROJECTS: 'projects',
  PROJECT_MEDIA: 'project_media',
  PROJECT_TRANSLATIONS: 'project_translations',
  CLIENTS: 'clients',
  CLIENT_MEDIA: 'client_media',
  CLIENT_TRANSLATIONS: 'client_translations',
  SERVICES: 'services',
  SERVICE_MEDIA: 'service_media',
  SERVICE_TRANSLATIONS: 'service_translations',
  SERVICE_FEATURES: 'service_features',
  SERVICE_TERMS: 'service_terms',
  ADDRESSES: 'addresses',
  COUNTRIES: 'countries',
  STATES: 'states',
  CITIES: 'cities',
  USER_AUTH_DEVICES: 'user_auth_devices',
  USER_SESSIONS: 'user_sessions',
  PASSWORD_RECOVERY_ATTEMPTS: 'password_recovery_attempts',
  PAYMENT_METHODS: 'payment_methods',
  ABOUT_PAGE: 'about_page',
  USER_STORAGE_REQUESTS: 'user_storage_requests',
  LLM_TOKENS_USAGE: 'llm_tokens_usage',
  MEDIA_MODERATIONS: 'media_moderations',
  BENEFITS: 'benefits',
  USER_BENEFITS: 'user_benefits',
  INVITATION_LINKS: 'invitation_links',
  WAIT_LIST: 'wait_list',
  EMAIL_PREFERENCES: 'email_preferences',
  ASSETS: 'assets',
  LAYOUTS: 'layouts',
  LAYOUT_CONFIG: 'layout_config',
} as const;

export const COUNTRY_TO_LANGUAGES: Record<string, string> = {
  // Spanish-speaking
  es: "Spanish",
  mx: "Spanish",
  ar: "Spanish",
  co: "Spanish",
  cl: "Spanish",
  pe: "Spanish",
  ve: "Spanish",
  uy: "Spanish",
  py: "Spanish",
  bo: "Spanish",
  ec: "Spanish",

  // Portuguese-speaking
  pt: "Portuguese",
  br: "Portuguese",

  // English-speaking
  us: "English",
  gb: "English",
  ie: "English",
  ca: "English",
  au: "English",
  nz: "English",

  // French-speaking
  fr: "French",
  be: "French", // default (multilingual, but safe)
  ch: "French", // default fallback
  lu: "French",

  // German-speaking
  de: "German",
  at: "German",

  // Italian
  it: "Italian",

  // Dutch
  nl: "Dutch",

  // Polish
  pl: "Polish",

  // Russian
  ru: "Russian",

  // Japanese
  jp: "Japanese",

  // Chinese
  cn: "Chinese",

  // Korean
  kr: "Korean",

  // Turkish
  tr: "Turkish",

  // Greek
  gr: "Greek",

  // Czech
  cz: "Czech",

  // Swedish
  se: "Swedish",

  // Norwegian
  no: "Norwegian",

  // Danish
  dk: "Danish",

  // Finnish
  fi: "Finnish",

  // Romanian
  ro: "Romanian",

  // Hungarian
  hu: "Hungarian",

  // Arabic
  sa: "Arabic",
  ae: "Arabic",
  eg: "Arabic",

  // Hebrew
  il: "Hebrew",
};


/**
 * Named severity thresholds for content moderation (0–10).
 */
export const MODERATION_SEVERITY = {
  SAFE: 0,
  MINIMAL: 1,
  LOW: 3,
  MODERATE: 5,
  HIGH: 7,
  SEVERE: 9,
  CRITICAL: 10,
} as const;


export type AvailableEnums = keyof typeof ENUMS;
export type EnumType<T extends AvailableEnums> = (typeof ENUMS)[T][number];
export const DEFAULT_COMPRESSION_LVL: EnumType<'COMPRESSION_LEVEL'> = 'HIGH';
