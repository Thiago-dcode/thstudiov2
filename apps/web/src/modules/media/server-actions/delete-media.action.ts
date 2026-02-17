'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import mediaService from "../media.service";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import { revalidateTag } from "next/cache";
import { userSession } from "@/modules/auth/server-actions/user-session.action";

export const deleteMediaAction = async (
    id: number,
    userId: number
): Promise<ActionReturn<boolean>> => {

    const userAuth = await userSession();
    if(!userAuth || userAuth.id !== userId){
        return {
            data: null,
            errors: ['Unauthorized'],
        };
    }
    const response = await mediaService.delete(id);

    if (response.error) {
        return {
            data: null,
            errors: getFriendlyApiErrors(response),
        };
    }

    revalidateTag(`user-${userId}`, 'max');

    return {
        data: true,
        errors: null,
    };
};

