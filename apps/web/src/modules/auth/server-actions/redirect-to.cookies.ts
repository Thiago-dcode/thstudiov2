import { REDIRECT_TO_COOKIE_NAME } from "@repo/common-lib/constants/cookies";
import {
  isRedirectToKey,
  type RedirectToKey,
} from "@repo/common-lib/constants/redirect-to";
import type {
  RequestCookies,
  ResponseCookies,
} from "next/dist/compiled/@edge-runtime/cookies";

const REDIRECT_TO_MAX_AGE_SECONDS = 60 * 5;

const redirectToCookieOptions = {
  httpOnly: true,
  path: "/",
  maxAge: REDIRECT_TO_MAX_AGE_SECONDS,
} as const;

export const getRedirectToByCookie = (
  cookieStore: RequestCookies | ResponseCookies,
): RedirectToKey | null => {
  const value = cookieStore.get(REDIRECT_TO_COOKIE_NAME)?.value;
  if (!value || !isRedirectToKey(value)) {
    return null;
  }
  return value;
};

export const setRedirectToByCookie = (
  cookieStore: RequestCookies | ResponseCookies,
  redirectTo: string,
) => {
  if (!isRedirectToKey(redirectTo)) {
    return;
  }
  cookieStore.set(REDIRECT_TO_COOKIE_NAME, redirectTo, redirectToCookieOptions);
};

export const deleteRedirectToByCookie = (
  cookieStore: RequestCookies | ResponseCookies,
) => {
  cookieStore.set(REDIRECT_TO_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
};
