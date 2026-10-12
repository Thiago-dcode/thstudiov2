"use server";
import { TWO_FA_COOKIE_NAME } from "@repo/common-lib/constants/cookies";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { encryptObj, getEncryptedJsonCookie } from "@/lib/utils";
import authService from "../auth.service";
import type { TwoFaUser, UserAuth } from "../auth.types";
import { verify2faRequestSchema } from "../schemas/auth.shema";
import { setUserSession } from "./user-session.action";

export const verify2faServerAction = async (
  formData: FormData,
): Promise<
  ActionReturn<
    UserAuth,
    {
      email?: string;
      twofa_code?: string;
    }
  >
> => {
  const credentials = {
    email: formData.get("email")
      ? (formData.get("email") as string)
      : undefined,
    twofa_code: formData.get("twofa_code")
      ? (formData.get("twofa_code") as string)
      : undefined,
  };
  const t = await getTranslations();
  const validatedData = verify2faRequestSchema(t).safeParse(credentials);
  if (!validatedData.success) {
    const errors = Object.values(
      validatedData.error.flatten().fieldErrors,
    ).flat();
    return {
      data: null,
      errors,
      inputs: {
        email: credentials.email,
        twofa_code: credentials.twofa_code,
      },
    };
  }
  const result = await authService.verify2fa({
    email: validatedData.data.email,
    twofa_code: validatedData.data.twofa_code,
  });
  if (result.error || result.data === null) {
    return {
      data: null,
      errors:
        result.error && result.error.status_code === 400
          ? [result.error?.errors.join(",")]
          : [t("actions.genericError")],
      inputs: {
        email: credentials.email,
        twofa_code: credentials.twofa_code,
      },
    };
  }
  //Success
  await Promise.all([delete2faCookie(), setUserSession(result.data)]);
  return {
    data: result.data,
    errors: null,
    inputs: {
      email: credentials.email,
      twofa_code: credentials.twofa_code,
    },
  };
};
export const get2faCookieData = async (): Promise<TwoFaUser | null> => {
  return await getEncryptedJsonCookie<TwoFaUser>(TWO_FA_COOKIE_NAME);
};

export const delete2faCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FA_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
  });
};

/**
 * Asks for a new code. The email comes only from the encrypted, httpOnly 2FA cookie, which only a
 * correct password or a fresh registration sets — never from the client — so this can't be used to
 * mail codes to someone else.
 */
export const resend2faServerAction = async (): Promise<
  ActionReturn<{ twofa_expires_at: string }, undefined>
> => {
  const t = await getTranslations();
  const current = await get2faCookieData();
  if (!current?.email) {
    return {
      data: null,
      errors: [t("auth.twoFa.sessionExpired")],
      inputs: undefined,
    };
  }
  const result = await authService.resend2fa(current.email);
  if (result.error || !result.data) {
    return {
      data: null,
      errors:
        result.error?.status_code === 400
          ? result.error.errors
          : [t("actions.genericError")],
      inputs: undefined,
    };
  }
  await set2faCookie({ ...result.data, is_new: current.is_new });
  return {
    data: { twofa_expires_at: String(result.data.twofa_expires_at) },
    errors: null,
    inputs: undefined,
  };
};

export const set2faCookie = async (user: TwoFaUser) => {
  const cookieStore = await cookies();
  // An account whose email was never confirmed is still finishing sign-up, whichever form
  // (register or login) brought it here.
  const twoFaUser: TwoFaUser = {
    ...user,
    is_new: user.is_new ?? !user.email_validated,
  };
  cookieStore.set(TWO_FA_COOKIE_NAME, await encryptObj(twoFaUser), {
    httpOnly: true,
    // Outlives the 10-minute code so an expired code can still be resent from the same page
    // instead of sending the user back through login.
    maxAge: 60 * 30,
  });
};
