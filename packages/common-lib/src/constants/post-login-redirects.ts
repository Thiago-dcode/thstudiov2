export const ALLOWED_POST_LOGIN_REDIRECTS = {
  'atelier/settings/subscription': true,
} as const;

export type AllowedPostLoginRedirect = keyof typeof ALLOWED_POST_LOGIN_REDIRECTS;

export const normalizePostLoginRedirect = (
  redirect: string,
): AllowedPostLoginRedirect | null => {
  const normalized = redirect.replace(/^\/+/, '').trim();
  if (
    !normalized ||
    normalized.includes('..') ||
    normalized.includes('://') ||
    normalized.startsWith('//')
  ) {
    return null;
  }
  return normalized in ALLOWED_POST_LOGIN_REDIRECTS
    ? (normalized as AllowedPostLoginRedirect)
    : null;
};

export const stripLocalePrefix = (
  pathname: string,
  locales: readonly string[],
): string => {
  const segments = pathname.split('/').filter(Boolean);
  if (
    segments.length > 0 &&
    locales.includes(segments[0].toLowerCase())
  ) {
    return segments.slice(1).join('/');
  }
  return segments.join('/');
};
