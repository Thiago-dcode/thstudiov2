// ==================== EVENTS ====================
export const NEW_USER_EVENT = 'new.user' as const;
export const SET_INITIAL_USER_EXTRA_DATA_EVENT = 'set-initial.user-extra-data' as const;
export const UPDATE_PROFILE_STATUS_EVENT = 'update-profile-status.event' as const;
export const SET_FREE_SUBSCRIPTION_EVENT = 'set-free.subscription' as const;
/** Stop a user's paid subscription from renewing (cancel at period end). Emitted by account deletion. */
export const CANCEL_SUBSCRIPTION_RENEWAL_EVENT = 'cancel-renewal.subscription' as const;
