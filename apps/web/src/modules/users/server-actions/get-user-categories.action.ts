"use server";

import type { CategoryBase } from "@repo/common-lib/types/category";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import usersService from "../users.service";

export const getUserCategoriesAction = async (
  id: number,
): Promise<ActionReturn<CategoryBase[], undefined>> => {
  const categoriesResponse = await usersService.getAllCategories(id);

  if (categoriesResponse.data) {
    return {
      data: categoriesResponse.data,
      errors: null,
      inputErrors: undefined,
    };
  }
  return {
    data: null,
    errors: getFriendlyApiErrors(categoriesResponse),
  };
};
