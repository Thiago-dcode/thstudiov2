// ==================== REQUEST HEADERS ====================
export const REQUEST_START_TIME = 'x-app-req-start-time' as const;
export const USER_ID_HEADER = 'x-app-user-id' as const;
export const USER_AGENT_HEADER = 'x-app-user-agent' as const;
export const IP_ADDRESS_HEADER = 'x-app-ip-address' as const;
export const APP_API_KEY_HEADER = 'x-app-api-key' as const;
/**
 * Shared private token guarding otherwise-public machine endpoints (e.g. the sitemap feed) so only
 * our own Next.js app can reach them. Sent as a request header; distinct from the same-named auth
 * cookie ({@link USER_AUTH_COOKIE_NAME}), which travels in the `Cookie` header instead.
 */
export const APP_TOKEN_HEADER = 'x-app-token' as const;
