'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import { initiateSubscriptionSchema } from "../schemas/plan-subscriptions.shema"
import { HandleSubscriptionProcessResponse, InitiateSubscriptionRequest } from "@repo/common-lib/types/plan-subscription";
import planSubscriptionsService from "../plan-subscriptions.service";
import { cookies } from "next/headers";
import { INITIATE_SUBCRIPTION_COOKIE } from "@repo/common-lib/constants/constants";
import { encryptObj, getEncryptedJsonCookie } from "@/lib/utils";
import { generateUUID } from "@repo/common-lib/utils/generate-uuid";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { revalidateTag } from "next/cache";
import { userSession } from "@/modules/auth/server-actions/user-session.action";


export const initiateSubscriptionAction = async (formData:FormData):Promise<ActionReturn<HandleSubscriptionProcessResponse, InitiateSubscriptionRequest>> =>{

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
    
      const[user] =  await Promise.all([userSession(),setInitiateSubscriptionCookie({
            ...result.data,
            token:uuid
        })]);
        
        revalidateTag(`subscription-${user?.id}`,'max');
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
        maxAge: 60 * 20 // 20 min
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