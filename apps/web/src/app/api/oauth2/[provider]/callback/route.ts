import { timingSafeEqual } from "node:crypto";
import { ENUMS } from "@repo/common-lib/constants/enums";
import type { OauthProviders } from "@repo/common-lib/types/auth";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/env/server";
import { errorName, webLogger, withLogTrace } from "@/lib/logging/logger";
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

const LOG_FIELDS = { operation: "oauth-callback" };

/** Standard OAuth error codes (`access_denied`…). Anything else is attacker-controlled noise. */
const OAUTH_ERROR_CODE = /^[a-z_]{1,64}$/;

/**
 * A silent rejection: one stable message, the check that failed in `reason`. `warn`, not
 * `critical`: a second initiate in another tab, the back button or an expired cookie produce the
 * same states as a forged callback, and the API throttles real abuse.
 */
const reject = (reason: string, extra?: Record<string, unknown>) => {
  webLogger.warn("OAuth callback rejected", { reason, ...extra }, LOG_FIELDS);
  return redirectTo("/");
};

/**
 * Where the provider sends the browser back after consent. A failure of any kind (unknown
 * provider, denied consent, missing or replayed code, state mismatch, API rejection) silently
 * lands on the home page: these mostly come from forged or replayed callbacks, so the response
 * says nothing about which check failed. The log line does (`reason`).
 *
 * Never logged: code, state, verifier, invitation code, token, username.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  return withLogTrace(async () => {
    let step = "params";
    try {
      const { provider } = await params;
      // The raw value is user input: never logged.
      if (!isOauthProvider(provider)) return reject("unknown-provider");
      const info = { provider };
      webLogger.info("OAuth callback started", info, LOG_FIELDS);

      // The provider reports denied consent or a failure as `?error=...`.
      const { searchParams } = request.nextUrl;
      const providerError = searchParams.get("error");
      if (providerError) {
        return reject("provider-error", {
          ...info,
          provider_error: OAUTH_ERROR_CODE.test(providerError)
            ? providerError
            : "other",
        });
      }

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      if (!code || !state) {
        return reject("missing-params", {
          ...info,
          has_code: Boolean(code),
          has_state: Boolean(state),
        });
      }

      // Must match this browser's copy from the initiate step (absent once its 10 minutes passed,
      // or when the flow was never started here).
      step = "state-cookie";
      const attempt = await getOauthInitiateCookie();
      if (!attempt) return reject("no-attempt", info);
      if (!sameState(state, attempt.state))
        return reject("state-mismatch", info);

      // Registration-closed and invitation rules are the API's: existing accounts sign in without
      // an invitation, and only a new account needs one.
      step = "api-callback";
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
        // 4xx: the user's case (closed registration, bad invitation…). 5xx: the api failed.
        const level = result.error.status_code >= 500 ? "error" : "warn";
        webLogger[level](
          "OAuth callback rejected by api",
          {
            ...info,
            invited: Boolean(invitationCode),
            api_error_code: result.error.api_error_code ?? null,
            shown_to_user: Boolean(urlError),
          },
          { ...LOG_FIELDS, status_code: result.error.status_code },
        );
        if (!urlError) return redirectTo("/");
        // Keep the invitation: with registration closed, sign-up without it bounces to the home
        // page, and the user needs it to retry (e.g. with the invited email after a mismatch).
        const query = new URLSearchParams({
          [AUTH_URL_ERROR_PARAM]: urlError,
        });
        if (invitationCode) query.set("ref", invitationCode);
        return redirectTo(`/auth/register?${query}`);
      }
      if (!result.data?.auth?.token) {
        // The api answered success without a session: a contract break, not a user problem.
        webLogger.critical(
          "OAuth callback succeeded without a token",
          { ...info, has_data: Boolean(result.data) },
          LOG_FIELDS,
        );
        return redirectTo("/");
      }

      const { auth, alreadyExist } = result.data;
      // A new owner for this username: a lookup cached before it existed would 404 their page. Not
      // `updateTag` (Server Actions only); `expire: 0` so the next request never gets the stale answer.
      step = "session";
      if (!alreadyExist)
        revalidateTag(`user-exists-${auth.username}`, { expire: 0 });
      const response = redirectTo(alreadyExist ? "/atelier" : "/get-started");
      await setUserSessionByCookie(auth, response.cookies);
      webLogger.success(
        "OAuth callback completed",
        { ...info, user_id: auth.id, new_account: !alreadyExist },
        LOG_FIELDS,
      );
      return response;
    } catch (error) {
      // Every expected failure returns above; reaching here is an unknown error (api unreachable,
      // cookie or session code throwing). The user still lands on the home page.
      webLogger.critical(
        "OAuth callback failed",
        { step, error_name: errorName(error) },
        LOG_FIELDS,
      );
      return redirectTo("/");
    }
  });
}
