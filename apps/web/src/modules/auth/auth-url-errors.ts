import type { ApiErrorKey } from "@repo/common-lib/constants/api-errors";

/** Query param that carries an error code across a redirect, shown once as a toast. */
export const AUTH_URL_ERROR_PARAM = "error";

/**
 * The only codes a redirect may carry, keyed by the API error they come from. Anything else in
 * `?error=` is ignored, so a crafted link cannot make the site show arbitrary text.
 * Each value needs a message under `authUrlErrors` in every locale.
 */
export const AUTH_URL_ERRORS = {
  REGISTRATION_CLOSED: "registration_closed",
  REGISTRATION_INVITATION_EMAIL_MISMATCH: "invitation_email_mismatch",
  REGISTRATION_INVITATION_EXPIRED: "invitation_expired",
  REGISTRATION_INVITATION_USED: "invitation_used",
  REGISTRATION_EMAIL_RESERVED: "email_reserved",
} as const satisfies Partial<Record<ApiErrorKey, string>>;

export type AuthUrlError =
  (typeof AUTH_URL_ERRORS)[keyof typeof AUTH_URL_ERRORS];

const KNOWN = new Set<string>(Object.values(AUTH_URL_ERRORS));

export const isAuthUrlError = (
  value: string | null | undefined,
): value is AuthUrlError => !!value && KNOWN.has(value);

/** The URL code for an API error the user can act on, or `null` for anything else. */
export const authUrlErrorFromApi = (
  code: ApiErrorKey | undefined,
): AuthUrlError | null =>
  code && code in AUTH_URL_ERRORS
    ? AUTH_URL_ERRORS[code as keyof typeof AUTH_URL_ERRORS]
    : null;
