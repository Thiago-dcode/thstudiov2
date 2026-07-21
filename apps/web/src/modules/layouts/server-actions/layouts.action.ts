"use server";

import type { Layout, LayoutIndexRequest } from "@repo/common-lib/types/layout";
import type { ActionReturn, Pagination } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import layoutsService from "../layouts.service";

export const getAllLayoutsAction = async (
  params?: LayoutIndexRequest,
): Promise<ActionReturn<Layout[], { pagination?: Pagination }>> => {
  const result = await layoutsService.getAll({
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
