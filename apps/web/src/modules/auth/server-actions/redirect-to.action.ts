"use server";

import type { RedirectToKey } from "@repo/common-lib/constants/redirect-to";
import { cookies } from "next/headers";
import {
  deleteRedirectToByCookie,
  getRedirectToByCookie,
} from "./redirect-to.cookies";

export const getRedirectTo = async (): Promise<RedirectToKey | null> => {
  const cookieStore = await cookies();
  return getRedirectToByCookie(cookieStore);
};

export const deleteRedirectTo = async () => {
  const cookieStore = await cookies();
  deleteRedirectToByCookie(cookieStore);
};
