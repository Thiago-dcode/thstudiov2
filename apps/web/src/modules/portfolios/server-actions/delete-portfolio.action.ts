'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import portfolioService from "../portfolio.service";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";

export const deletePortfolioAction = async (
    id: number
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

