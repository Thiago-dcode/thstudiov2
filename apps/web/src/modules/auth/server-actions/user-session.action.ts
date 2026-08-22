"use server";

import {
  REMEMBER_ME_COOKIE_NAME,
  USER_AUTH_COOKIE_EXPIRATION_DATE,
  USER_AUTH_COOKIE_NAME,
} from "@repo/common-lib/constants/cookies";
import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { addDays, addMonths } from "date-fns";
import type {
  RequestCookies,
  ResponseCookies,
} from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { serverEnv } from "@/env/server";
import type { UserAuth } from "../auth.types";

const SECRET = serverEnv.ENCRYPTION_SECRET;

export const userSession = async () => {
  const cookieStore = await cookies();
  return userSessionByCookie(cookieStore);
};
export const isUserAuthenticated = async () => {
  const session = await userSession();
  return session !== null;
};
export const userSessionByCookie = async (
  cookies: RequestCookies | ResponseCookies,
) => {
  let cookieValue = cookies.get(USER_AUTH_COOKIE_NAME)?.value ?? null;
  cookieValue = cookieValue ? decrypt(cookieValue, SECRET) : null;
  if (!cookieValue) {
    return null;
  }
  let userAuth: UserAuth | null;
  try {
    userAuth = JSON.parse(cookieValue) as UserAuth;
  } catch (error) {
    console.error("Failed to parse user session cookie:", error);
    return null;
  }
  if (!userAuth?.token || !userAuth?.id) {
    return null;
  }
  return userAuth;
};
export const setUserSession = async (userAuth: UserAuth) => {
  //Should match the same expiration date as the token from the server
  const cookieStore = await cookies();
  setUserSessionByCookie(userAuth, cookieStore);
};
export const setRememberMe = async () => {
  const cookieStore = await cookies();
  setRememberMeByCookie(cookieStore);
};
export const setRememberMeByCookie = async (
  cookies: RequestCookies | ResponseCookies,
) => {
  cookies.set(REMEMBER_ME_COOKIE_NAME, "1", {
    httpOnly: true,
    expires: addMonths(new Date(), 1),
  });
};
export const getRememberMe = async () => {
  const cookieStore = await cookies();
  return getRememberMeByCookie(cookieStore);
};
export const getRememberMeByCookie = async (
  cookies: RequestCookies | ResponseCookies,
) => {
  return !!cookies.get(REMEMBER_ME_COOKIE_NAME)?.value;
};
export const deleteRememberMe = async () => {
  const cookieStore = await cookies();
  deleteRememberMeByCookie(cookieStore);
};
export const deleteRememberMeByCookie = async (
  cookies: RequestCookies | ResponseCookies,
) => {
  cookies.set(REMEMBER_ME_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
  });
};

export const setUserSessionByCookie = async (
  userAuth: UserAuth,
  cookies: RequestCookies | ResponseCookies,
) => {
  const expireAt = addDays(new Date(), 1);
  const cookieOptions = {
    httpOnly: true,
    expires: expireAt,
  };
  cookies.set(
    USER_AUTH_COOKIE_NAME,
    encrypt(JSON.stringify(userAuth), SECRET),
    cookieOptions,
  );
  const data = encrypt(expireAt.getTime().toString(), SECRET);
  cookies.set(USER_AUTH_COOKIE_EXPIRATION_DATE, data, cookieOptions);
};
export const getUserSessionExpirationDate = async () => {
  const cookieStore = await cookies();
  return getUserSessionExpirationDateByCookie(cookieStore);
};
export const getUserSessionExpirationDateByCookie = async (
  cookies: RequestCookies | ResponseCookies,
) => {
  const cookieValue =
    cookies.get(USER_AUTH_COOKIE_EXPIRATION_DATE)?.value ?? null;
  if (!cookieValue) {
    return null;
  }
  const timestamp = decrypt(cookieValue, SECRET);
  return new Date(Number(timestamp));
};

export const deleteUserSession = async () => {
  const cookieStore = await cookies();
  deleteUserSessionByCookie(cookieStore);
};

export const deleteUserSessionByCookie = async (
  cookies: RequestCookies | ResponseCookies,
) => {
  cookies.set(USER_AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
  });
  cookies.set(USER_AUTH_COOKIE_EXPIRATION_DATE, "", {
    httpOnly: true,
    maxAge: 0,
  });
};
