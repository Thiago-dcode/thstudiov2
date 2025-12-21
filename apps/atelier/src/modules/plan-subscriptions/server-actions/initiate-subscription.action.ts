'use server'

import { ActionReturn } from "@/modules/auth/auth.types";
import { initiateSubscriptionSchema } from "../schemas/plan-subscriptions.shema"
import { HandleSubscriptionProcessResponse, InitiateSubscriptionRequest } from "@repo/common-lib/types/plan-subscription";
import planSubscriptionsService from "../plan-subscriptions.service";
import { cookies } from "next/headers";
import { INITIATE_SUBCRIPTION_COOKIE } from "@repo/common-lib/constants/constants";
import { encryptObj, getEncryptedJsonCookie } from "@/lib/utils";
import { generateUUID } from "@repo/common-lib/utils/generate-uuid";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";


export const initiateSubscriptionAction = async (formData:FormData):Promise<ActionReturn<InitiateSubscriptionRequest, HandleSubscriptionProcessResponse>> =>{

    const validated = initiateSubscriptionSchema.safeParse({
            plan_price_id: parseInt(formData.get('plan_price_id') as string),
            payment_method:formData.get('payment_method'),
            success_url:formData.get('success_url'),
            cancel_url:formData.get('cancel_url')
    });

    if(!validated.success){
        return {
            data:null,
            errors:['Something went wrong'],
            inputs:validated.data
        }
    }

try{
    //Generate a unique id
    const uuid = await generateUUID();
    validated.data.success_url = queryParamBuilder(validated.data.success_url,{
        token:uuid
    });
    validated.data.cancel_url = queryParamBuilder(validated.data.cancel_url,{
        token:uuid
    });
    const result = await planSubscriptionsService.initiate(validated.data);
   if(result.data && !result.error){

    if(result.data.redirect_url){
        await setInitiateSubscriptionCookie({
            ...result.data,
            token:uuid
        });
    }
    //Success
    return {
        data:result.data,
        errors:null,
        inputs:validated.data
       }
   }
}
catch(e){
    console.error("Error during initiateSubscriptionAction",e);
}
return {
    data:null,
    errors:['Something went wrong'],
    inputs:validated.data
}

}



export const setInitiateSubscriptionCookie = async (data:HandleSubscriptionProcessResponse & {
    token:string
})=>{
    const cookieStore = await cookies();
    cookieStore.set(INITIATE_SUBCRIPTION_COOKIE, await encryptObj(data), {
        httpOnly: true,
        maxAge: 60 * 60 // 1 hour
    });
}

export const getInitiateSubscriptionCookie = async () => {
    return await getEncryptedJsonCookie<HandleSubscriptionProcessResponse & {
        token:string
        
    }>(INITIATE_SUBCRIPTION_COOKIE);
}

export const deleteInitiateSubscriptionCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.set(INITIATE_SUBCRIPTION_COOKIE, '', {
        httpOnly: true,
        maxAge: 0
    });
}