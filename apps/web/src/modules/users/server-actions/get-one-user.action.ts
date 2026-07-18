"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { User } from "@repo/common-lib/types/user";
import {
  getFriendlyApiErrors,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import usersService from "../users.service";

export const getOneUserAction = async (
  id: number,
): Promise<ActionReturn<User, undefined>> => {
  const session = await requireSession();
  if (!isSessionOwner(session, id)) {
    return unauthorizedActionReturn<User, undefined>();
  }

  const user = await usersService.getOne(id);

  if (user.data) {
    return {
      data: user.data,
      errors: null,
    };
  }
  return {
    data: null,
    errors: getFriendlyApiErrors(user),
  };
};
