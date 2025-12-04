'use server'

import { CategoryIndexRequest } from "@repo/common-lib/types/category"
import categoriesService from "../categories.service"



export const getAllCategoriesAction = async (params?:CategoryIndexRequest,signal?:AbortSignal|null) =>{

    console.log('PARAMS',params, 'SIGNAL',signal);
    if(signal) categoriesService.signal= signal;
    return await categoriesService.getAll({
        page:1,
        paginated:true,
    ...params,
    })


}