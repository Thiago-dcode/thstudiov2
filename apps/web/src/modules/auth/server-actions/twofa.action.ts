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

export const set2faCookie = async (user: TwoFaUser) => {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FA_COOKIE_NAME, await encryptObj(user), {
    httpOnly: true,
    maxAge: 60 * 10, //10 minutes
  });
};
