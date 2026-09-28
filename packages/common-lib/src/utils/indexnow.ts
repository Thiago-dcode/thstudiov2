import { createHash } from 'crypto';

/**
 * The one host whose pages may be indexed (and therefore submitted to IndexNow). Mirrors
 * `CANONICAL_HOST` in the web app's `isIndexableEnv()`: dev, previews and localhost never submit.
 */
export const INDEXNOW_CANONICAL_HOST = 'a11studio.com';

/** Where the web app serves the key, as IndexNow's `keyLocation`. A dotted path: skipped by the locale proxy. */
export const INDEXNOW_KEY_PATH = '/indexnow-key.txt';

/**
 * The IndexNow key, derived from the shared `APP_TOKEN` so the web (which serves the key file) and
 * the API (which submits URLs) agree on it with no extra secret to provision.
 *
 * Safe to publish: it is a salted SHA-256 of the token, so the key file reveals nothing usable about
 * `APP_TOKEN`. 32 hex chars, inside IndexNow's 8–128 `[a-zA-Z0-9-]` rule.
 */
export const deriveIndexNowKey = (appToken: string): string =>
  createHash('sha256').update(`indexnow:${appToken}`).digest('hex').slice(0, 32);
