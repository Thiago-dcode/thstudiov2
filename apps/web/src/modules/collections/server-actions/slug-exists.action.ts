"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import userCollectionService from "@/modules/user-collections/user-collection.service";

export const slugExistsAction = async (
  username: string,
  slug: string,
): Promise<ActionReturn<boolean, undefined>> => {
  if (!slug.trim()) {
    return {
      data: false,
      errors: null,
      inputErrors: undefined,
    };
  }

  const response = await userCollectionService.slugExists(username, slug);

  return {
    data: !!response.data?.exists,
    errors: null,
    inputErrors: undefined,
  };
};
