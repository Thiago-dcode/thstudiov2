import { POST_LOGIN_REDIRECT_COOKIE_NAME } from "@repo/common-lib/constants/constants";
import {
  type AllowedPostLoginRedirect,
  normalizePostLoginRedirect,
} from "@repo/common-lib/constants/post-login-redirects";
import type {
  RequestCookies,
  ResponseCookies,
} from "next/dist/compiled/@edge-runtime/cookies";

const POST_LOGIN_REDIRECT_MAX_AGE_SECONDS = 60 * 30;

const postLoginRedirectCookieOptions = {
  httpOnly: true,
  path: "/",
  maxAge: POST_LOGIN_REDIRECT_MAX_AGE_SECONDS,
} as const;

export const getPostLoginRedirectByCookie = (
  cookieStore: RequestCookies | ResponseCookies,
): AllowedPostLoginRedirect | null => {
  const value = cookieStore.get(POST_LOGIN_REDIRECT_COOKIE_NAME)?.value;
  if (!value) {
    return null;
  }
  return normalizePostLoginRedirect(value);
};

export const setPostLoginRedirectByCookie = (
  cookieStore: RequestCookies | ResponseCookies,
  redirect: string,
) => {
  const normalized = normalizePostLoginRedirect(redirect);
  if (!normalized) {
    return;
  }
  cookieStore.set(
    POST_LOGIN_REDIRECT_COOKIE_NAME,
    normalized,
    postLoginRedirectCookieOptions,
  );
};

export const deletePostLoginRedirectByCookie = (
  cookieStore: RequestCookies | ResponseCookies,
) => {
  cookieStore.set(POST_LOGIN_REDIRECT_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
};
