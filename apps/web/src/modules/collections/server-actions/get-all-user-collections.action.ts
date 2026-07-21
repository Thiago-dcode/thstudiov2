"use server";

import type {
  Collection,
  CollectionIndexRequest,
} from "@repo/common-lib/types/collection";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import collectionService from "@/modules/collections/collection.service";

export type GetAllUserCollectionsParams = Omit<
  CollectionIndexRequest,
  "user_id"
>;

export const getAllUserCollectionsAction = async (
  userId: number,
  params?: GetAllUserCollectionsParams,
): Promise<ActionReturn<Collection[], undefined>> => {
  const result = await collectionService.findAll({
    ...params,
    user_id: userId,
  });

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
    errors: await getFriendlyApiErrors(result),
    inputErrors: undefined,
  };
};
