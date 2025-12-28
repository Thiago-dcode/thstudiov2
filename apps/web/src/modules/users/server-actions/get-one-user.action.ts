'use server'

import { ActionReturn } from "@/modules/auth/auth.types"
import { User } from "@repo/common-lib/types/user"
import usersService from "../users.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"



export const getOneUserAction =  async (id:number): Promise<ActionReturn<undefined,User>> =>{


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