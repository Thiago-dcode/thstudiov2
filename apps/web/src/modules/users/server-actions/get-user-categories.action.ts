'use server'

import { ActionReturn } from "@repo/common-lib/types/response"
import usersService from "../users.service"
import { getFriendlyApiErrors } from "@/modules/auth/helpers"
import { CategoryBase } from "@repo/common-lib/types/category"



export const getUserCategoriesAction =  async (id:number): Promise<ActionReturn<CategoryBase[], undefined>> =>{


    const categoriesResponse = await usersService.getAllCategories(id);

    if(categoriesResponse.data){

        return {
            data:categoriesResponse.data,
            errors:null,
            inputErrors:undefined,
        }
    }
    return  {
        data:null,
        errors: getFriendlyApiErrors(categoriesResponse)
    }




}