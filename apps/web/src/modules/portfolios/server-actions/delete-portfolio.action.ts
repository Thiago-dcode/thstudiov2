"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import portfolioService from "../portfolio.service";

export const deletePortfolioAction = async (
 id: number,
): Promise<ActionReturn<boolean>> => {
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
