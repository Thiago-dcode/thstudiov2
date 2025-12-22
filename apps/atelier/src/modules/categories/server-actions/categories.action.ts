'use server'

import { CategoryIndexRequest } from "@repo/common-lib/types/category"
import categoriesService from "../categories.service"



export const getAllCategoriesAction = async (params?:CategoryIndexRequest) =>{
    return await categoriesService.getAll({
        page:1,
        paginated:true,
    ...params,
    })


}