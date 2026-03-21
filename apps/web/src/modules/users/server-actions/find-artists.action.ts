'use server'

import { ActionReturn } from "@repo/common-lib/types/response"
import { ArtistCard, ArtistIndexRequest } from "@repo/common-lib/types/user"
import usersService from "../users.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"

export const findArtistsAction = async (params: ArtistIndexRequest): Promise<ActionReturn<ArtistCard[], undefined>> => {

    const result = await usersService.findAll(params);

    if (result.data) {
        return {
            data: result.data,
            errors: null,
        }
    }
    return {
        data: null,
        errors: getFriendlyApiErrors(result)
    }
}
