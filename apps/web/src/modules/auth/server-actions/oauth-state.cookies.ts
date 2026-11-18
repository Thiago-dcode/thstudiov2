import { createHash, randomBytes } from "node:crypto";
import {
  OAUTH_INVITATION_CODE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "@repo/common-lib/constants/cookies";
import type { OauthProviders } from "@repo/common-lib/types/auth";
import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { addMinutes } from "date-fns";
import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { serverEnv } from "@/env/server";
import { SECURE_COOKIE_FLAGS } from "@/lib/utils/cookie-flags";

const SECRET = serverEnv.ENCRYPTION_SECRET;

/** Where the provider sends the browser back. Initiate and code exchange must use the same one. */
export const oauthCallbackUrl = (provider: OauthProviders) =>
  `${serverEnv.APP_URL}/api/oauth2/${provider}/callback`;

/** This browser's half of one OAuth attempt: the CSRF state and the PKCE verifier. */
type OauthAttempt = { state: string; verifier: string };

const isOauthAttempt = (value: unknown): value is OauthAttempt =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as OauthAttempt).state === "string" &&
  typeof (value as OauthAttempt).verifier === "string";

/**
 * Starts an attempt: keeps the state and the PKCE verifier (RFC 7636, 43 base64url chars) in an
 * encrypted cookie and returns what goes to the provider, the state and the S256 challenge.
 */
export const setOauthInitiateCookie = async () => {
  const cookieStore = await cookies();
  const expireAt = addMinutes(new Date(), 10);
  const attempt: OauthAttempt = {
    state: randomBytes(32).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
  };
  cookieStore.set(
    OAUTH_STATE_COOKIE_NAME,
    encrypt(JSON.stringify(attempt), SECRET),
    { ...SECURE_COOKIE_FLAGS, expires: expireAt },
  );
  return {
    state: attempt.state,
    codeChallenge: createHash("sha256")
      .update(attempt.verifier)
      .digest("base64url"),
  };
};

/** The pending attempt, or `null` when absent, expired, tampered or in an older format. */
export const getOauthInitiateCookie =
  async (): Promise<OauthAttempt | null> => {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
    if (!cookieValue) return null;
    const decrypted = decrypt(cookieValue, SECRET);
    if (!decrypted) return null;
    try {
      const parsed: unknown = JSON.parse(decrypted);
      return isOauthAttempt(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

export const setInvitationCodeCookie = async (invitationCode: string) => {
  const cookieStore = await cookies();
  const expireAt = addMinutes(new Date(), 10);
  cookieStore.set(OAUTH_INVITATION_CODE_COOKIE_NAME, invitationCode, {
    ...SECURE_COOKIE_FLAGS,
    expires: expireAt,
  });
};

export const getInvitationCodeCookie = async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(OAUTH_INVITATION_CODE_COOKIE_NAME)?.value;
  return cookieValue || null;
};

export const deleteInvitationCodeCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_INVITATION_CODE_COOKIE_NAME, "", {
    ...SECURE_COOKIE_FLAGS,
    maxAge: 0,
  });
};

/** Both OAuth cookies are single-use: cleared on every callback, whatever its outcome. */
export const clearOauthCookiesByCookie = (cookieStore: ResponseCookies) => {
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, "", {
    ...SECURE_COOKIE_FLAGS,
    maxAge: 0,
  });
  cookieStore.set(OAUTH_INVITATION_CODE_COOKIE_NAME, "", {
    ...SECURE_COOKIE_FLAGS,
    maxAge: 0,
  });
};
