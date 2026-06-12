"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { User } from "@repo/common-lib/types/user";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import usersService from "../users.service";

export const getOneUserAction = async (
  id: number,
): Promise<ActionReturn<User, undefined>> => {
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
