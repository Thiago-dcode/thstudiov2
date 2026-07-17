import {
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_HEADER,
} from "@repo/common-lib/constants/constants";
import type { EnumType } from "@repo/common-lib/constants/enums";
import {
  isRedirectToKey,
  REDIRECT_TO_QUERY_PARAM,
  REDIRECT_TO_TARGETS,
} from "@repo/common-lib/constants/redirect-to";
import { subMinutes } from "date-fns";
import type {
  RequestCookies,
  ResponseCookies,
} from "next/dist/compiled/@edge-runtime/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing, urlLocaleToLanguageCode } from "./i18n/routing";
import authService from "./modules/auth/auth.service";
import { setRedirectToByCookie } from "./modules/auth/server-actions/redirect-to.cookies";
import {
  deleteUserSessionByCookie,
  getRememberMeByCookie,
  getUserSessionExpirationDateByCookie,
  setUserSessionByCookie,
  userSessionByCookie,
} from "./modules/auth/server-actions/user-session.action";

const intlMiddleware = createIntlMiddleware(routing);

/** Copies cookies/headers already set on `from` (language cookie, refreshed session, etc) onto `to`. */
const copyResponseExtras = (from: NextResponse, to: NextResponse) => {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  const languageHeader = from.headers.get(LANGUAGE_HEADER);
  if (languageHeader) {
    to.headers.set(LANGUAGE_HEADER, languageHeader);
  }
};

/**
 * Turns `response` into a redirect to the same destination with the
 * `redirectTo` query param stripped, while preserving any cookies/headers
 * already set on it. If `response` was itself already a redirect (e.g. from
 * the intl middleware), the param is stripped from its target instead of the
 * original request URL.
 */
const stripRedirectToParam = (
  response: NextResponse,
  requestUrl: URL,
): NextResponse => {
  const location = response.headers.get("location");
  const targetUrl = location ? new URL(location) : new URL(requestUrl);
  targetUrl.searchParams.delete(REDIRECT_TO_QUERY_PARAM);

  const redirectResponse = NextResponse.redirect(targetUrl);
  copyResponseExtras(response, redirectResponse);
  return redirectResponse;
};

/**
 * Turns `response` into a redirect straight to `targetPath`, preserving any
 * cookies/headers already set on it. Used when the user is already logged in,
 * so there's no need to go through the `redirectTo` cookie + login flow.
 */
const redirectToTarget = (
  response: NextResponse,
  requestUrl: URL,
  targetPath: string,
): NextResponse => {
  const targetUrl = new URL(`/${targetPath}`, requestUrl);
  const redirectResponse = NextResponse.redirect(targetUrl);
  copyResponseExtras(response, redirectResponse);
  return redirectResponse;
};

const handleRefreshToken = async (
  cookies: RequestCookies,
  responseCookies: ResponseCookies,
) => {
  const expirationDate = await getUserSessionExpirationDateByCookie(cookies);
  const tenMinutes = 10 * 60 * 1000;
  const now = Date.now();
  const expirationDate10MinutesAgo = expirationDate
    ? subMinutes(expirationDate, 10).getTime()
    : null;
  if (
    !expirationDate10MinutesAgo ||
    expirationDate10MinutesAgo - now > tenMinutes
  ) {
    return;
  }
  const userAuth = await userSessionByCookie(cookies);
  if (!userAuth) return;
  const result = await authService.refreshToken();
  if (!result?.data || result.error) {
    deleteUserSessionByCookie(responseCookies);
  } else {
    await setUserSessionByCookie(result.data, responseCookies);
  }
};

const handleRememberMe = async (
  cookies: RequestCookies,
  _responseCookies: ResponseCookies,
) => {
  const rememberMe = await getRememberMeByCookie(cookies);
  if (!rememberMe) return;
  const userAuth = await userSessionByCookie(cookies);
  if (userAuth) return;
};

const proxy = async (req: NextRequest) => {
  const segments = req.nextUrl.pathname.split("/");
  const firstSeg = (segments[1] ?? "").toLowerCase();
  const isLocaleShaped = /^[a-z]{2}$/.test(firstSeg);

  if (
    isLocaleShaped &&
    !(routing.locales as readonly string[]).includes(firstSeg)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `/${segments.slice(2).join("/")}`;
    return NextResponse.redirect(url);
  }

  let response = intlMiddleware(req);

  const resolvedLanguageCode: EnumType<"LANGUAGE_CODE"> = (
    routing.locales as readonly string[]
  ).includes(firstSeg)
    ? urlLocaleToLanguageCode(firstSeg)
    : urlLocaleToLanguageCode(routing.defaultLocale);

  response.cookies.set(LANGUAGE_COOKIE_NAME, resolvedLanguageCode);
  response.headers.set(LANGUAGE_HEADER, resolvedLanguageCode);

  await handleRefreshToken(req.cookies, response.cookies);
  await handleRememberMe(req.cookies, response.cookies);

  const redirectToParam =
    req.nextUrl.searchParams.get(REDIRECT_TO_QUERY_PARAM) ?? "";

  if (isRedirectToKey(redirectToParam)) {
    const userAuth = await userSessionByCookie(req.cookies);
    if (userAuth) {
      response = redirectToTarget(
        response,
        req.nextUrl,
        REDIRECT_TO_TARGETS[redirectToParam],
      );
    } else {
      setRedirectToByCookie(response.cookies, redirectToParam);
      response = stripRedirectToParam(response, req.nextUrl);
    }
  }

  return response;
};

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};

export default proxy;
