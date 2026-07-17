/**
 * Query param used to request a post-login destination, e.g. `?redirectTo=get-started`.
 * The value must be one of the keys in `REDIRECT_TO_TARGETS`.
 */
export const REDIRECT_TO_QUERY_PARAM = 'redirectTo' as const;

/** Maps a short, public-facing redirect key to its actual app path. */
export const REDIRECT_TO_TARGETS = {
  'subscriptions': 'atelier/settings/subscription',
  'get-started': 'get-started',
  'atelier': 'atelier',
} as const;

export type RedirectToKey = keyof typeof REDIRECT_TO_TARGETS;

export const isRedirectToKey = (value: string): value is RedirectToKey =>
  value in REDIRECT_TO_TARGETS;

/** Resolves a redirect key to its target app path, or `null` if not allowed. */
export const resolveRedirectToTarget = (key: string): string | null =>
  isRedirectToKey(key) ? REDIRECT_TO_TARGETS[key] : null;

/**
 * Builds `<appUrl>?redirectTo=<key>`, e.g. `https://app.example.com?redirectTo=subscriptions`.
 * Meant for links sent outside the app (e.g. transactional emails): the proxy
 * middleware picks up the query param, stores it in a cookie, and the actual
 * target path (`REDIRECT_TO_TARGETS[key]`) is resolved after the user signs in.
 */
export const buildRedirectToUrl = (appUrl: string, key: RedirectToKey): string =>
  `${appUrl}?${REDIRECT_TO_QUERY_PARAM}=${key}`;
