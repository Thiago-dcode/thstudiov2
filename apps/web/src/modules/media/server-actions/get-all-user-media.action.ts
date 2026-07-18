"use server";

import type {
  GetAllUserMediaQueryParams,
  Media,
} from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import {
  getFriendlyApiErrors,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import usersService from "@/modules/users/users.service";

export type GetAllUserMediaParams = GetAllUserMediaQueryParams;

export const getAllUserMediaAction = async (
  userId: number,
  params?: GetAllUserMediaQueryParams,
): Promise<ActionReturn<Media[], undefined>> => {
  const session = await requireSession();
  if (!isSessionOwner(session, userId)) {
    return unauthorizedActionReturn<Media[], undefined>();
  }

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
};
