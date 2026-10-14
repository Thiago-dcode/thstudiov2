"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import { revalidateTag, updateTag } from "next/cache";
import {
  getFriendlyApiErrors,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import usersService from "../users.service";

/**
 * Deactivate (`active: false`, hidden from the public, nothing deleted) or reactivate the account.
 */
export const setAccountActiveAction = async (
  id: number,
  active: boolean,
): Promise<ActionReturn<{ is_active: boolean }, undefined>> => {
  const session = await requireSession();
  if (!isSessionOwner(session, id)) {
    return await unauthorizedActionReturn<{ is_active: boolean }, undefined>();
  }

  const result = active
    ? await usersService.reactivate(id)
    : await usersService.deactivate(id);
  if (result.error) {
    return { data: null, errors: await getFriendlyApiErrors(result) };
  }

  // `updateTag`, not `revalidateTag(..., "max")`: the atelier reads the new account status right
  // away (metrics refresh), and stale-while-revalidate would hand it the old one first.
  updateTag(`user-${id}`);
  revalidateTag(`user-branding-${session!.username}`, "max");
  return { data: result.data!, errors: null, inputErrors: undefined };
};
