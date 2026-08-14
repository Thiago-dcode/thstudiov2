"use server";

import type {
  CategoryBase,
  CategoryIndexRequest,
} from "@repo/common-lib/types/category";
import type { ActionReturn, Pagination } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import categoriesService from "../categories.service";

export const getAllCategoriesAction = async (
  params?: CategoryIndexRequest,
): Promise<ActionReturn<CategoryBase[], { pagination?: Pagination }>> => {
  const result = await categoriesService.getAll({
    page: 1,
    paginated: true,
    is_active: true,
    ...params,
  });

  if (result.data) {
    return {
      data: result.data,
      errors: null,
      inputs: { pagination: result.pagination },
    };
  }
  return {
    data: null,
    errors: await getFriendlyApiErrors(result),
  };
};

export const getActiveCategoriesAction = async (): Promise<
  ActionReturn<Omit<CategoryBase, "thumbnail">[], undefined>
> => {
  const result = await categoriesService.getAllActive();

  if (result.data) {
    return {
      data: result.data,
      errors: null,
    };
  }
  return {
    data: null,
    errors: await getFriendlyApiErrors(result),
  };
};
