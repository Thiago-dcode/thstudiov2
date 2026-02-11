'use server'

import usersService from "@/modules/users/users.service";
import { ActionReturn } from "@repo/common-lib/types/response";
import { Media } from "@repo/common-lib/types/media";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";

export const getAllUserMediaAction = async (userId: number): Promise<ActionReturn<Media[], undefined>> => {
  const result = await usersService.getAllMedia(userId);

  if (result.data) {
    return {
      data: result.data,
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
