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
 * Instagram profile URL (after `normalizeInstagramLink`). `http`/`https`,
 * optional `www.`, `instagram.com`, then a handle (letters, numbers, `.`, `_`, `-`).
 *
 * Valid:   `https://instagram.com/leo`, `https://www.instagram.com/leo.vinci/`
 * Invalid: `https://twitter.com/leo` (wrong host)
 *
 * Bare handles like `leo` are accepted as input — normalize them first.
 */
export const INSTAGRAM_URL_REGEX =
  /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?$/i;

/**
 * Facebook profile/page URL (after `normalizeFacebookLink`). Accepts
 * `facebook.com`, `fb.com`, `m.facebook.com`, `fb.me`, then any non-empty path.
 *
 * Bare page slugs are accepted as input — normalize them first.
 */
export const FACEBOOK_URL_REGEX =
  /^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\/[A-Za-z0-9._%\-/?=&]+$/i;

/**
 * YouTube channel/handle URL (after `normalizeYoutubeLink`). Accepts
 * `youtube.com` and `youtu.be`, then a non-empty path (`/@handle`, `/channel/…`,
 * `/c/…`, `/user/…`).
 *
 * Bare handles like `mychannel` are accepted as input — normalize them first.
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

/**
 * True when the value looks like a URL (or host/path) rather than a bare username.
 * Bare handles like `myinstauser` or `@mychannel` must not match.
 */
const looksLikeUrl = (value: string, hosts: readonly string[]): boolean => {
  if (/^https?:\/\//i.test(value) || /^www\./i.test(value)) return true;
  const lower = value.toLowerCase();
  return hosts.some(
    (host) =>
      lower === host ||
      lower.startsWith(`${host}/`) ||
      lower.startsWith(`${host}?`),
  );
};

/** Ensure a scheme so `instagram.com/x` becomes `https://instagram.com/x`. */
const ensureHttps = (value: string): string => {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
};

const stripLeadingAt = (value: string): string => value.replace(/^@+/, '');

/**
 * Instagram: accept a bare handle (`myinstauser`, `@myinstauser`) or a full
 * Instagram URL. Bare handles become `https://instagram.com/{handle}`.
 * Official URLs are kept (scheme added if missing). Other domains stay as-is
 * so the platform regex can reject them.
 */
export const normalizeInstagramLink = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const hosts = ['instagram.com', 'www.instagram.com'] as const;
  if (looksLikeUrl(trimmed, hosts)) {
    return ensureHttps(trimmed);
  }

  const handle = stripLeadingAt(trimmed);
  if (!handle) return '';
  return `https://instagram.com/${handle}`;
};

/**
 * Facebook: accept a bare username/page slug or an official Facebook / fb.com URL.
 * Bare values become `https://facebook.com/{slug}`.
 */
export const normalizeFacebookLink = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const hosts = [
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'fb.com',
    'www.fb.com',
    'fb.me',
    'www.fb.me',
  ] as const;
  if (looksLikeUrl(trimmed, hosts)) {
    return ensureHttps(trimmed);
  }

  const slug = stripLeadingAt(trimmed);
  if (!slug) return '';
  return `https://facebook.com/${slug}`;
};

/**
 * YouTube: accept a bare handle (`mychannel`, `@mychannel`) or an official
 * YouTube / youtu.be URL. Bare handles become `https://youtube.com/@{handle}`.
 */
export const normalizeYoutubeLink = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const hosts = [
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'www.youtu.be',
  ] as const;
  if (looksLikeUrl(trimmed, hosts)) {
    return ensureHttps(trimmed);
  }

  const handle = stripLeadingAt(trimmed);
  if (!handle) return '';
  return `https://youtube.com/@${handle}`;
};
