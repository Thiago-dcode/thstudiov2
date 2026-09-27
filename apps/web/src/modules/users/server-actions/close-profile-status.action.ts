"use server";

import type { ProfileStatus } from "@repo/common-lib/types/profile-status";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { revalidateTag } from "next/cache";
import {
  getFriendlyApiErrors,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import usersService from "../users.service";

export const closeProfileStatusAction = async (
  id: number,
): Promise<ActionReturn<ProfileStatus, undefined>> => {
  const session = await requireSession();
  if (!isSessionOwner(session, id)) {
    return await unauthorizedActionReturn<ProfileStatus, undefined>();
  }

  const result = await usersService.closeProfileStatus(id);

  if (result.error) {
    return {
      data: null,
      errors: await getFriendlyApiErrors(result),
    };
  }

  revalidateTag(`user-${id}`, "max");
  return {
    data: result.data!,
    errors: null,
    inputErrors: undefined,
  };
};
