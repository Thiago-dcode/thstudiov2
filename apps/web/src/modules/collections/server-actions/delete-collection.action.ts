'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import collectionService from "../collection.service";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";

export const deleteCollectionAction = async (
    id: number
): Promise<ActionReturn<boolean>> => {

    const response = await collectionService.delete(id);

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
