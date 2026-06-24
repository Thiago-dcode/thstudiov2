import {
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_HEADER,
} from "@repo/common-lib/constants/constants";
import type { EnumType } from "@repo/common-lib/constants/enums";
import { stripLocalePrefix } from "@repo/common-lib/constants/post-login-redirects";
import { subMinutes } from "date-fns";
import type {
  RequestCookies,
  ResponseCookies,
} from "next/dist/compiled/@edge-runtime/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing, urlLocaleToLanguageCode } from "./i18n/routing";
import authService from "./modules/auth/auth.service";
import { setPostLoginRedirectByCookie } from "./modules/auth/server-actions/post-login-redirect.action";
import {
  deleteUserSessionByCookie,
  getRememberMeByCookie,
  getUserSessionExpirationDateByCookie,
  setUserSessionByCookie,
  userSessionByCookie,
} from "./modules/auth/server-actions/user-session.action";

const intlMiddleware = createIntlMiddleware(routing);

const handlePostLoginRedirect = async (
  cookies: RequestCookies,
  responseCookies: ResponseCookies,
  pathname: string,
) => {
  const userAuth = await userSessionByCookie(cookies);
  if (userAuth) {
    return;
  }

  const pathWithoutLocale = stripLocalePrefix(pathname, routing.locales);
  if (!pathWithoutLocale) {
    return;
  }
  setPostLoginRedirectByCookie(responseCookies, pathWithoutLocale);
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

  const response = intlMiddleware(req);

  const resolvedLanguageCode: EnumType<"LANGUAGE_CODE"> = (
    routing.locales as readonly string[]
  ).includes(firstSeg)
    ? urlLocaleToLanguageCode(firstSeg)
    : urlLocaleToLanguageCode(routing.defaultLocale);

  response.cookies.set(LANGUAGE_COOKIE_NAME, resolvedLanguageCode);
  response.headers.set(LANGUAGE_HEADER, resolvedLanguageCode);

  await handlePostLoginRedirect(
    req.cookies,
    response.cookies,
    req.nextUrl.pathname,
  );
  await handleRefreshToken(req.cookies, response.cookies);
  await handleRememberMe(req.cookies, response.cookies);

  return response;
};

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};

export default proxy;
