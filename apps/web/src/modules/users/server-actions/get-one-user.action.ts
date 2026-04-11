'use server'

import { ActionReturn } from "@repo/common-lib/types/response"
import { User } from "@repo/common-lib/types/user"
import usersService from "../users.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"



export const getOneUserAction =  async (id:number): Promise<ActionReturn<User, undefined>> =>{


    const user = await usersService.getOne(id);

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