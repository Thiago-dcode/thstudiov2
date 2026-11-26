/**
 * Cloudflare Turnstile (bot check on email/password sign-up). Shared by the api (Siteverify) and
 * the web (widget). Pure constants only.
 */

/** The `action` a widget is rendered with and the api expects back from Siteverify. */
export const TURNSTILE_ACTIONS = {
  SIGNUP: 'signup',
} as const;

export type TurnstileAction = (typeof TURNSTILE_ACTIONS)[keyof typeof TURNSTILE_ACTIONS];

/**
 * Request body field carrying the widget token. It must keep `token` in its name: log redaction
 * and the exception filter's `requestBody` copy hide it because of that substring.
 */
export const TURNSTILE_TOKEN_FIELD = 'turnstile_token';

/** Cloudflare's documented maximum token length. */
export const TURNSTILE_TOKEN_MAX_LENGTH = 2048;

export const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/** Always-pass test keys: the local fallback when no real key is configured. Never in production. */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

/** Every documented Cloudflare test site key and secret. Production refuses all of them. */
export const TURNSTILE_TEST_KEYS: ReadonlySet<string> = new Set([
  // Site keys
  '1x00000000000000000000AA',
  '2x00000000000000000000AB',
  '1x00000000000000000000BB',
  '2x00000000000000000000BB',
  '3x00000000000000000000FF',
  // Secret keys
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);
