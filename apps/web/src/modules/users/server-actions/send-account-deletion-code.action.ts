"use server";

import { API_ERRORS } from "@repo/common-lib/constants/api-errors";
import type { ActionReturn } from "@repo/common-lib/types/response";
import type { AccountDeletionCodeResult } from "@repo/common-lib/types/user";
import { getTranslations } from "next-intl/server";
import {
  getFriendlyApiErrors,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import usersService from "../users.service";

/** Emails the code that confirms "delete my account" (for accounts with or without a password). */
export const sendAccountDeletionCodeAction = async (
  id: number,
): Promise<ActionReturn<AccountDeletionCodeResult, undefined>> => {
  const session = await requireSession();
  if (!isSessionOwner(session, id)) {
    return await unauthorizedActionReturn<
      AccountDeletionCodeResult,
      undefined
    >();
  }

  const result = await usersService.sendDeletionCode(id);
  if (result.error) {
    const t = await getTranslations("atelier.settings.dangerZone.delete");
    const { status_code } = result.error;
    const errors =
      status_code === 409
        ? [t("alreadyRequested")]
        : result.error.api_error_code ===
            API_ERRORS.ACCOUNT_DELETION_CODE_DAILY_LIMIT
          ? [t("codeDailyLimit")]
          : status_code === 429
            ? [t("codeCooldown")]
            : status_code === 503
              ? [t("codeNotSent")]
              : await getFriendlyApiErrors(result);
    return { data: null, errors };
  }
  return { data: result.data!, errors: null, inputErrors: undefined };
};
