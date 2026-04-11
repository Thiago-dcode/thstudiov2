'use server'

import usersService from "@/modules/users/users.service";
import type { UserService } from "@/modules/users/users.service";
import { ActionReturn } from "@repo/common-lib/types/response";
import { Media } from "@repo/common-lib/types/media";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";

export type GetAllUserMediaParams = Parameters<UserService['getAllMedia']>[1];

export const getAllUserMediaAction = async (
  userId: number,
  params?: GetAllUserMediaParams,
): Promise<ActionReturn<Media[], undefined>> => {
  const result = await usersService.getAllMedia(userId, params);

  if (result.data) {
    return {
      data: result.data,
      pagination: result.pagination,
      errors: null,
      inputErrors: undefined,
    };
  }

  return {
    data: null,
    errors: getFriendlyApiErrors(result),
    inputErrors: undefined,
  };
}
