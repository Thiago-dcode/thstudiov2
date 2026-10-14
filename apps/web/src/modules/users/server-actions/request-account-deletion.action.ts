"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type {
  AccountDeletionRequestResult,
  RequestAccountDeletionInput,
} from "@repo/common-lib/types/user";
import { revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  getFriendlyApiErrors,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import usersService from "../users.service";

/** Flags the account for deletion (password re-entered in the dialog). */
export const requestAccountDeletionAction = async (
  id: number,
  formData: FormData,
): Promise<
  ActionReturn<
    AccountDeletionRequestResult,
    Pick<RequestAccountDeletionInput, "cancel_subscription">
  >
> => {
  const session = await requireSession();
  if (!isSessionOwner(session, id)) {
    return await unauthorizedActionReturn<
      AccountDeletionRequestResult,
      Pick<RequestAccountDeletionInput, "cancel_subscription">
    >();
  }

  const t = await getTranslations("atelier.settings.dangerZone.delete");
  const password = formData.get("password");
  const body: RequestAccountDeletionInput = {
    password: typeof password === "string" ? password : "",
    cancel_subscription: formData.get("cancel_subscription") === "on",
  };
  // `inputs` is echoed back to the browser: never include the password in it.
  const inputs = { cancel_subscription: body.cancel_subscription };
  if (!body.password) {
    return { data: null, errors: [t("passwordRequired")], inputs };
  }

  const result = await usersService.requestDeletion(id, body);
  if (result.error) {
    const { status_code } = result.error;
    const errors =
      status_code === 400
        ? [t("wrongPassword")]
        : status_code === 409
          ? [t("alreadyRequested")]
          : status_code === 429
            ? [t("tooManyAttempts")]
            : await getFriendlyApiErrors(result);
    return { data: null, errors, inputs };
  }

  revalidateTag(`user-${id}`, "max");
  revalidateTag(`user-branding-${session!.username}`, "max");
  return { data: result.data!, errors: null, inputErrors: undefined, inputs };
};
