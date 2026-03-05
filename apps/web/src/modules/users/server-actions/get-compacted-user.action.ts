'use server'

import { ActionReturn } from "@repo/common-lib/types/response"
import { CompactUser } from "@repo/common-lib/types/user"
import usersService from "../users.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"



export const getUserCompactedAction =  async (username:string): Promise<ActionReturn<CompactUser, undefined>> =>{


    const user = await usersService.getCompact(username);

    if(user.data){

        return {
            data:user.data,
            errors:null,
        }
    }
    return  {
        data:null,
        errors: getFriendlyApiErrors(user)
    }




}