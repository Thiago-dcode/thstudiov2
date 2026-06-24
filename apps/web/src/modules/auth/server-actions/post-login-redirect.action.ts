"use server";

import type { AllowedPostLoginRedirect } from "@repo/common-lib/constants/post-login-redirects";
import { cookies } from "next/headers";
import {
  deletePostLoginRedirectByCookie,
  getPostLoginRedirectByCookie,
} from "./post-login-redirect.cookies";

export const getPostLoginRedirect =
  async (): Promise<AllowedPostLoginRedirect | null> => {
    const cookieStore = await cookies();
    return getPostLoginRedirectByCookie(cookieStore);
  };

export const deletePostLoginRedirect = async () => {
  const cookieStore = await cookies();
  deletePostLoginRedirectByCookie(cookieStore);
};
