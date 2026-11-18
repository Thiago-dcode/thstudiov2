"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type {
  AccountDeletionRequestResult,
  RequestAccountDeletionInput,
} from "@repo/common-lib/types/user";
import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  getFriendlyApiErrors,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import usersService from "../users.service";

/** Flags the account for deletion, confirmed with the code emailed by `sendAccountDeletionCodeAction`. */
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
  const code = formData.get("code");
  const body: RequestAccountDeletionInput = {
    code: typeof code === "string" ? code.replace(/\s/g, "") : "",
    cancel_subscription: formData.get("cancel_subscription") === "on",
  };
  // `inputs` is echoed back to the browser: the code is a secret, keep it out.
  const inputs = { cancel_subscription: body.cancel_subscription };
  if (!/^\d{6}$/.test(body.code)) {
    return { data: null, errors: [t("codeRequired")], inputs };
  }

  const result = await usersService.requestDeletion(id, body);
  if (result.error) {
    const { status_code } = result.error;
    const errors =
      status_code === 400
        ? [t("wrongCode")]
        : status_code === 409
          ? [t("alreadyRequested")]
          : status_code === 429
            ? [t("tooManyAttempts")]
            : await getFriendlyApiErrors(result);
    return { data: null, errors, inputs };
  }

  // `updateTag`, not `revalidateTag(..., "max")`: the atelier reads the new account status right
  // away (metrics refresh), and stale-while-revalidate would hand it the old one first.
  updateTag(`user-${id}`);
  return { data: result.data!, errors: null, inputErrors: undefined, inputs };
};
