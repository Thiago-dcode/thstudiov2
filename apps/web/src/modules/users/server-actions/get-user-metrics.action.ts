'use server'

import { ActionReturn } from "@/modules/auth/auth.types"
import { UserMetrics } from "@repo/common-lib/types/user"
import usersService from "../users.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"



export const getUserMetricsAction = async (id: number): Promise<ActionReturn<undefined, UserMetrics>> => {

    const metrics = await usersService.metrics(id);

    if (metrics.data) {

        return {
            data: metrics.data,
            errors: null,
        }
    }
    return {
        data: null,
        errors: getFriendlyApiErrors(metrics)
    }

}

