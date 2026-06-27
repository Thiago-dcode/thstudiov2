"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import portfolioService from "@/modules/portfolios/portfolio.service";

export const getPortfolioHighlightCountAction = async (): Promise<
  ActionReturn<number, undefined>
> => {
  const response = await portfolioService.getHighlightCount();

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
