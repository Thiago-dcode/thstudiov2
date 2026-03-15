'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import userServiceService from "@/modules/user-services/user-service.service"

export const serviceSlugExistsAction = async (username: string, slug: string): Promise<ActionReturn<boolean, undefined>> => {
    if (!slug.trim()) {
        return {
            data: false,
            errors: null,
            inputErrors: undefined,
        }
    }

    const response = await userServiceService.slugExists(username, slug);

    return {
        data: !!response.data?.exists,
        errors: null,
        inputErrors: undefined,
    }
}
