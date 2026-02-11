'use server'

import { ActionReturn } from "@repo/common-lib/types/response"
import { UserMetrics } from "@repo/common-lib/types/user"
import usersService from "../users.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"



export const getUserMetricsAction = async (id: number): Promise<ActionReturn<UserMetrics, undefined>> => {

    const metrics = await usersService.metrics(id);

    if (metrics.data) {

        return {
            data: metrics.data,
            errors: null,
            inputErrors:undefined,
        }
    }
    return {
        data: null,
        errors: getFriendlyApiErrors(metrics)
    }

}

