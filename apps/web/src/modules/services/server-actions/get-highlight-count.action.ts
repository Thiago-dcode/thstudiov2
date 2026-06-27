"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import serviceService from "@/modules/services/service.service";

export const getServiceHighlightCountAction = async (): Promise<
  ActionReturn<number, undefined>
> => {
  const response = await serviceService.getHighlightCount();

  if (response.error) {
    return {
      data: null,
      errors: [response.error.message],
      inputErrors: undefined,
    };
  }

  return {
    data: response.data?.count ?? 0,
    errors: null,
    inputErrors: undefined,
  };
};
