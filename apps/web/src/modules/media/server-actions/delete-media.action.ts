"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import { revalidateTag } from "next/cache";
import {
  getFriendlyApiErrors,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import mediaService from "../media.service";

export const deleteMediaAction = async (
  id: number,
): Promise<ActionReturn<boolean>> => {
  // Real ownership of `id` is validated against the media row on the backend
  // (mediaService.delete); this only needs to confirm the caller is signed in.
  const session = await requireSession();
  if (!session) {
    return await unauthorizedActionReturn<boolean>();
  }
  const response = await mediaService.delete(id);

  if (response.error) {
    return {
      data: null,
      errors: await getFriendlyApiErrors(response),
    };
  }

  revalidateTag(`user-${session.id}`, "max");

  return {
    data: true,
    errors: null,
  };
};
