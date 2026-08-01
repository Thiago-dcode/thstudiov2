/**
 * Shared validation rules for user contact + social profile fields.
 *
 * Single source of truth so the API (class-validator `@Matches`) and the web app
 * (zod `.regex`) enforce identical formats. Keep these in sync — do not redefine
 * per-layer regexes.
 */

/**
 * Phone number (E.164-ish). Optional leading `+`, then 9–15 digits.
 * Spaces/dashes should be stripped before validating.
 *
 * Valid:   `+34684317619`, `684317619`
 * Invalid: `912` (too short), `abc`, `+` alone
 */
export const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

/** Max stored length for a normalized phone number (`+` + up to 15 digits). */
export const PHONE_MAX_LENGTH = 20;

/** Max stored length for any social / website link. */
export const LINK_MAX_LENGTH = 255;

/**
 * Instagram profile URL. `http`/`https`, optional `www.`, `instagram.com`,
 * then a handle (letters, numbers, `.`, `_`, `-`).
 *
 * Valid:   `https://instagram.com/leo`, `https://www.instagram.com/leo.vinci/`
 * Invalid: `https://twitter.com/leo`, `leo`
 */
export const INSTAGRAM_URL_REGEX =
  /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?$/i;

/**
 * Facebook profile/page URL. Accepts `facebook.com`, `fb.com`, `m.facebook.com`,
 * `fb.me`, then any non-empty path.
 */
export const FACEBOOK_URL_REGEX =
  /^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\/[A-Za-z0-9._%\-/?=&]+$/i;

/**
 * YouTube channel/handle URL. Accepts `youtube.com` and `youtu.be`, then a
 * non-empty path (`/@handle`, `/channel/…`, `/c/…`, `/user/…`).
 */
export const YOUTUBE_URL_REGEX =
  /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/[A-Za-z0-9._%\-/?=&@]+$/i;

/**
 * Generic website URL. `http`/`https`, a dotted host, then an optional path.
 */
export const WEBSITE_URL_REGEX =
  /^https?:\/\/[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+(:\d+)?(\/[^\s]*)?$/i;

/** Strip spaces, dashes and parentheses so `+34 684 317 619` normalizes before validating. */
export const normalizePhone = (value: string): string =>
  value.replace(/[\s\-().]/g, '');
