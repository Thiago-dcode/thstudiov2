'use server';

import authService from "../auth.service";
import { passwordRecoveryRequestSchema } from "../schemas/auth.shema";
import {  AuthActionReturn, PasswordRecoveryAttempt } from "../auth.types";
import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME } from "@repo/common-lib/constants/constants";
import { deleteCookie } from "@/lib/utils";

export const passwordRecoveryAction = async (formData: FormData):Promise<AuthActionReturn<{
    email?:string
},PasswordRecoveryAttempt>> => {
    const credentials = {
        email: formData.get('email') as string,
        fallback_url: process.env.APP_URL + '/auth/password-recovery/recover',
    }
    const validatedData = passwordRecoveryRequestSchema.safeParse(credentials);
    if (!validatedData.success) {
        const errors = Object.values(validatedData.error.flatten().fieldErrors).map((value) => {
            return value
        }).flat();
     return {
        data:null,
        errors,
        inputs:{
            email:credentials.email
        }
     }
    }
    const passwordRecoveryAttemptCookie = await getPasswordRecoveryAttemptCookie();
    if(passwordRecoveryAttemptCookie){
        const expiresAt = new Date(passwordRecoveryAttemptCookie.expires_at);
        if(expiresAt < new Date() || passwordRecoveryAttemptCookie.code_validated){
            await deleteCookie(PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME);
        }else{
            //TODO: make user wait 1 minute and 30 seconds before trying again
            const waitTime = 1000 * 60 * 1.5;
            const timeDifference =new Date().getTime()- new Date(passwordRecoveryAttemptCookie.updated_at).getTime();
            if(timeDifference < waitTime){
                return{ 
                    errors: ['You must wait 1 minute and 30 seconds before trying again'],
                     data:null, 
                     inputs:{email:credentials.email}
                     };
            }
        }
        
    }
    const result = await authService.passwordRecovery(validatedData.data);
    if (result.error !==null) {
        const errorCode = result.error && result.error.status_code;
        return {
            data:null,
            errors :errorCode === 400? result.error.errors : ['Something went wrong'],
            inputs:{
                email:credentials.email
                
            }
        }
    }
    await setPasswordRecoveryAttemptCookie(result.data!)
    return {
        data:result.data!,
        errors:null,
        inputs:{
            email:credentials.email
        }
    }
}

export const setPasswordRecoveryAttemptCookie = async (passwordRecoveryAttempt: PasswordRecoveryAttempt) => {
    'use server';
    const cookieStore = await cookies();
    const data = encrypt(JSON.stringify(passwordRecoveryAttempt), config.encryption_secret);
    cookieStore.set(PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME, data, {
        httpOnly: true,
        maxAge:60 * 10 //10 minutes
    });
}
export const getPasswordRecoveryAttemptCookie = async () => {
    'use server';
    const cookieStore = await cookies();
    const data = cookieStore.get(PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME)?.value;
    if (!data) {
        return null;
    }
    const result = JSON.parse(decrypt(data, config.encryption_secret) as string) as PasswordRecoveryAttempt;
    if(!result?.id || !result?.code){
        return null;
    }
    return result;
}


export const deletePasswordAttemptCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.set(PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME, '', {
        httpOnly: true,
        maxAge: 0
    });
}

