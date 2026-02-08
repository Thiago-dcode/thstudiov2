'use server'

import { ActionReturn } from "@/modules/auth/auth.types";
import portfolioService from "../portfolio.service"



export const slugExistsAction = async (userId: number, slug: string): Promise<ActionReturn<undefined, boolean>> => {

    if (!slug.trim()) {

        return {
            data: false,
            errors: null,
            inputErrors: undefined,
        }
    }

    const response = await portfolioService.slugExists(userId, slug);

    return {
        data: !!response.data?.exists,
        errors: null,
        inputErrors: undefined,
    }


}