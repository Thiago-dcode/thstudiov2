"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import {
  getFriendlyApiErrors,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import portfolioService from "../portfolio.service";

export const deletePortfolioAction = async (
  id: number,
): Promise<ActionReturn<boolean>> => {
  const session = await requireSession();
  if (!session) {
    return unauthorizedActionReturn<boolean>();
  }

  const response = await portfolioService.delete(id);

  if (response.error) {
    return {
      data: null,
      errors: getFriendlyApiErrors(response),
    };
  }

  return {
    data: true,
    errors: null,
  };
};
