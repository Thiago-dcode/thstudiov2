'use server'

import collectionService from "@/modules/collections/collection.service";
import type { CollectionIndexRequest } from "@repo/common-lib/types/collection";
import { ActionReturn } from "@repo/common-lib/types/response";
import { Collection } from "@repo/common-lib/types/collection";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";

export type GetAllUserCollectionsParams = Omit<CollectionIndexRequest, 'user_id'>;

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
    errors: getFriendlyApiErrors(result),
    inputErrors: undefined,
  };
}
