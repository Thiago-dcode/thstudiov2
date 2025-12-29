'use server'

import { ActionReturn } from "@/modules/auth/auth.types"
import { User } from "@repo/common-lib/types/user"
import usersService from "../users.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"
import { CategoryBase } from "@repo/common-lib/types/category"



export const getUserCategoriesAction =  async (id:number): Promise<ActionReturn<undefined,CategoryBase[]>> =>{


    const categoriesResponse = await usersService.getAllCategories(id);

    if(categoriesResponse.data){

        return {
            data:categoriesResponse.data,
            errors:null,
        }
    }
    return  {
        data:null,
        errors: getFriendlyApiErrors(categoriesResponse)
    }




}