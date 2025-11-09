'use server'

import { CategoryIndexRequest } from "@repo/common-lib/types/category"
import categoriesService from "../categories/categories.service"



export const getAllCategoriesAction = async (params?:CategoryIndexRequest,signal?:AbortSignal|null) =>{

    if(signal) categoriesService.signal= signal;
    return await categoriesService.getAll({
        page:1,
        paginated:true,
    ...params,
    })



}