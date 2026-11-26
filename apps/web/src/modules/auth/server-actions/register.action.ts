"use server";

import { API_ERRORS } from "@repo/common-lib/constants/api-errors";
import { TURNSTILE_TOKEN_FIELD } from "@repo/common-lib/constants/turnstile";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getTranslations } from "next-intl/server";
import authService from "../auth.service";
import type { LoginReturn } from "../auth.types";
import { getObjErrorFromZod } from "../helpers";
import { registerRequestSchema } from "../schemas/auth.shema";
import { delete2faCookie, set2faCookie } from "./twofa.action";
import { setUserSession } from "./user-session.action";

export const registerServerAction = async (
  formData: FormData,
): Promise<
  ActionReturn<
    LoginReturn,
    {
      email?: string;
    }
  >
> => {
  // Clean up any existing 2FA cookie from previous login attempts
  await delete2faCookie();
  const credentials = {
    email: formData.get("email")
      ? (formData.get("email") as string)
      : undefined,
    password: formData.get("password")
      ? (formData.get("password") as string)
      : undefined,
    invitation_code: formData.get("invitation_code")
      ? (formData.get("invitation_code") as string)
      : undefined,
  };
  const t = await getTranslations();
  // Terms + age acceptance is enforced here too: the form's `required` is only a browser hint.
  if (formData.get("accept_terms") !== "on") {
    return {
      data: null,
      errors: [],
      inputErrors: {
        accept_terms: t("formPrivacyNotice.acceptTermsRequired"),
      },
      inputs: credentials,
    };
  }
  const validatedData = registerRequestSchema(t).safeParse(credentials);
  if (!validatedData.success) {
    return {
      data: null,
      errors: [],
      inputErrors: getObjErrorFromZod(validatedData.error),
      inputs: credentials,
    };
  }
  // The Turnstile token goes to the api only: never into `credentials`, which are echoed back as
  // `inputs`. Without one the api would answer 403, so skip the call.
  const turnstileToken = formData.get(TURNSTILE_TOKEN_FIELD);
  if (typeof turnstileToken !== "string" || !turnstileToken.trim()) {
    return {
      data: null,
      errors: [t("turnstile.failed")],
      inputs: credentials,
    };
  }
  const result = await authService.register({
    ...validatedData.data,
    turnstile_token: turnstileToken,
  });
  if (result.error || result.data === null) {
    const apiErrorCode = result.error?.api_error_code;
    const errors =
      apiErrorCode === API_ERRORS.TURNSTILE_FAILED
        ? [t("turnstile.failed")]
        : apiErrorCode === API_ERRORS.TURNSTILE_UNAVAILABLE
          ? [t("turnstile.unavailable")]
          : result.error &&
              (result.error.status_code === 400 ||
                result.error.status_code === 401)
            ? result.error.errors
            : [t("actions.genericError")];
    return {
      data: null,
      errors,
      inputs: credentials,
    };
  }
  //Success: a browser that already validated the email through the wait list gets a session
  // straight away; every other registration confirms the email with the 2FA code.
  if (result.data.token) {
    await setUserSession(result.data);
  } else {
    await set2faCookie({ ...result.data, is_new: true });
  }
  return {
    data: result.data,
    errors: null,
    inputs: credentials,
  };
};
