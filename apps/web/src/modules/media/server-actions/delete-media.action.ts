"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import { revalidateTag } from "next/cache";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import { userSession } from "@/modules/auth/server-actions/user-session.action";
import mediaService from "../media.service";

export const deleteMediaAction = async (
  id: number,
  userId: number,
): Promise<ActionReturn<boolean>> => {
  const userAuth = await userSession();
  if (!userAuth || userAuth.id !== userId) {
    return {
      data: null,
      errors: ["Unauthorized"],
    };
  }
  const response = await mediaService.delete(id);

  if (response.error) {
    return {
      data: null,
      errors: getFriendlyApiErrors(response),
    };
  }

  revalidateTag(`user-${userId}`, "max");

  return {
    data: true,
    errors: null,
  };
};
