'use server'

import { setUserSession, userSession } from "@/modules/auth/server-actions/user-session.action";
import { updateUserAction } from "./update-user.action"
import { redirect } from "next/navigation";



export const funnelAction = async (currentStep:number,formData:FormData) =>{
    const user = await userSession();
    if(!user){
        redirect('/auth/login');
    }
    
    const action = formData.get('action') as 'back'| 'continue';
    console.log(action)
    if(action !=='back' && action !=='continue') return{
        data:null,
        errors:['something went wrong'],
        inputs:undefined
    }

    // Get current funnel_step from user session
    const newFormData = action === 'back' ? new FormData(): formData;
    const nextStep = action === 'back'? currentStep -1 : currentStep +1;
        newFormData.set('funnel_step', String(nextStep));
      
    const result = await updateUserAction(user.id,newFormData);
    return result;
}