'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import userPortfolioService from "@/modules/user-portfolios/user-portfolio.service"



export const slugExistsAction = async (userId: number, slug: string): Promise<ActionReturn<boolean, undefined>> => {

    if (!slug.trim()) {

        return {
            data: false,
            errors: null,
            inputErrors: undefined,
        }
    }

    const response = await userPortfolioService.slugExists(userId, slug);

    return {
        data: !!response.data?.exists,
        errors: null,
        inputErrors: undefined,
    }


}