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

// ==================== REDIRECT-TO COOKIE ====================
export const REDIRECT_TO_COOKIE_NAME = 'x-app-redirect-to' as const;
