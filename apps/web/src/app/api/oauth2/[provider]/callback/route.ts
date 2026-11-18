import { timingSafeEqual } from "node:crypto";
import { ENUMS } from "@repo/common-lib/constants/enums";
import type { OauthProviders } from "@repo/common-lib/types/auth";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/env/server";
import authService from "@/modules/auth/auth.service";
import {
  AUTH_URL_ERROR_PARAM,
  authUrlErrorFromApi,
} from "@/modules/auth/auth-url-errors";
import {
  clearOauthCookiesByCookie,
  getInvitationCodeCookie,
  getOauthInitiateCookie,
  oauthCallbackUrl,
} from "@/modules/auth/server-actions/oauth-state.cookies";
import { setUserSessionByCookie } from "@/modules/auth/server-actions/user-session.action";

const isOauthProvider = (value: string): value is OauthProviders =>
  (ENUMS.OAUTH_PROVIDERS as readonly string[]).includes(value);

/** Constant-time: the state is a CSRF secret, so a byte-by-byte compare must not leak it. */
const sameState = (received: string, expected: string) => {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Built on APP_URL, not `request.url`: behind the proxy that is the internal host. The OAuth
 * cookies go on every response, so a state can never be replayed whatever the outcome.
 */
const redirectTo = (path: string) => {
  const response = NextResponse.redirect(new URL(path, serverEnv.APP_URL));
  clearOauthCookiesByCookie(response.cookies);
  return response;
};

/**
 * Where the provider sends the browser back after consent. A failure of any kind (unknown
 * provider, denied consent, missing or replayed code, state mismatch, API rejection) silently
 * lands on the home page: these mostly come from forged or replayed callbacks, so the response
 * says nothing about which check failed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    if (!isOauthProvider(provider)) return redirectTo("/");

    // The provider reports denied consent or a failure as `?error=...`.
    const { searchParams } = request.nextUrl;
    if (searchParams.get("error")) return redirectTo("/");

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !state) return redirectTo("/");

    // Must match this browser's copy from the initiate step (absent once its 10 minutes passed,
    // or when the flow was never started here).
    const attempt = await getOauthInitiateCookie();
    if (!attempt || !sameState(state, attempt.state)) return redirectTo("/");

    // Registration-closed and invitation rules are the API's: existing accounts sign in without
    // an invitation, and only a new account needs one.
    const invitationCode = await getInvitationCodeCookie();
    const result = await authService.oauth2Callback({
      code,
      provider,
      redirect_uri: oauthCallbackUrl(provider),
      // PKCE: proves this browser started the attempt, so a leaked code alone is useless.
      code_verifier: attempt.verifier,
      ...(invitationCode ? { invitation_code: invitationCode } : {}),
    });
    if (result.error) {
      // A rejection the user can act on (closed registration, used or expired invitation…)
      // goes back to sign-up with its code for the toast; anything else stays silent.
      const urlError = authUrlErrorFromApi(result.error.api_error_code);
      return redirectTo(
        urlError ? `/auth/register?${AUTH_URL_ERROR_PARAM}=${urlError}` : "/",
      );
    }
    if (!result.data?.auth?.token) return redirectTo("/");

    const { auth, alreadyExist } = result.data;

    // A new owner for this username: a lookup cached before it existed would 404 their page. Not
    // `updateTag` (Server Actions only); `expire: 0` so the next request never gets the stale answer.
    if (!alreadyExist)
      revalidateTag(`user-exists-${auth.username}`, { expire: 0 });
    const response = redirectTo(alreadyExist ? "/atelier" : "/get-started");
    await setUserSessionByCookie(auth, response.cookies);
    return response;
  } catch {
    return redirectTo("/");
  }
}
