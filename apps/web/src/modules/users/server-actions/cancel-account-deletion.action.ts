"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  getFriendlyApiErrors,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import usersService from "../users.service";

/** Reopens an account flagged for deletion. */
export const cancelAccountDeletionAction = async (
  id: number,
): Promise<ActionReturn<{ deletion_requested_at: null }, undefined>> => {
  const session = await requireSession();
  if (!isSessionOwner(session, id)) {
    return await unauthorizedActionReturn<
      { deletion_requested_at: null },
      undefined
    >();
  }

  const result = await usersService.cancelDeletion(id);
  if (result.error) {
    // 409 here means the deletion date has passed: the account is being deleted.
    const errors =
      result.error.status_code === 409
        ? [(await getTranslations("pendingDeletion"))("tooLate")]
        : await getFriendlyApiErrors(result);
    return { data: null, errors };
  }

  // `updateTag`, not `revalidateTag(..., "max")`: the atelier reads the new account status right
  // away (metrics refresh), and stale-while-revalidate would hand it the old one first.
  updateTag(`user-${id}`);
  return { data: result.data!, errors: null, inputErrors: undefined };
};
