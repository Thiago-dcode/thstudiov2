'use server';

import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import authService from "../auth.service";
import { passwordRecoveryRequestSchema } from "../schemas/auth.shema";
import { redirect } from "next/navigation";
import { PasswordRecoveryAttempt } from "../auth.types";
import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME } from "@repo/common-lib/constants";
import zod from "zod";
import { deleteCookie } from "@/lib/utils";

export const PasswordRecoveryAction = async (formData: FormData) => {
    const credentials = {
        email: formData.get('email') as string,
        fallback_url: process.env.APP_URL + '/auth/password-recovery/recover',
    }
    const validatedData = passwordRecoveryRequestSchema.safeParse(credentials);
    if (!validatedData.success) {
        const errors = Object.values(validatedData.error.flatten().fieldErrors).map((value) => {
            return value
        }).flat();
        const url = queryParamBuilder('/auth/password-recovery', { errors, email: credentials.email });
        redirect(url);
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
                const url = queryParamBuilder('/auth/password-recovery', { errors: ['You must wait 1 minute and 30 seconds before trying again'], email: validatedData.data.email });
                redirect(url);
            }
        }
        
    }
    const result = await authService.passwordRecovery(validatedData.data);
    if (result.error || result.data === null) {
        const errorCode = result.error && result.error.status_code;
        const url = queryParamBuilder('/auth/password-recovery', { errors: errorCode === 400? [result.error?.errors.join(',')] : ['Something went wrong'], email: validatedData.data.email });
        redirect(url);
    }
    //Success
    await setPasswordRecoveryAttemptCookie(result.data);
    redirect('/auth/password-recovery/success');
}
export const PasswordUpdateAction = async (formData:FormData) =>{
const resource = '/auth/password-recovery/recover';
    const {password,password_repeat,code} = {
        password: formData.get('password') as string,
        password_repeat: formData.get('password_repeat') as string,
        code:formData.get('attempt') as string
    }
    if(password !== password_repeat){

        const url = queryParamBuilder(resource, {attempt:code, errors: ['Password must have at least 8 characters long'] });
        redirect(url);

    }

    const validatedPassword = zod.string('Invalid password').min(8, 'Invalid password').safeParse(password);

    if(!validatedPassword.success){
        const url = queryParamBuilder(resource, {attempt:code, errors: ['Password must have at least 8 characters long'] });
        redirect(url);
    }

    const result = await authService.updatePassword({
        code,
        password
    });

    if(result.error|| !result.data){
        const errorCode = result.error && result.error.status_code;
        const url = queryParamBuilder(resource, {attempt:code, errors: errorCode === 400? [result.error?.errors.join(',')] : ['Something went wrong'] });
        redirect(url);
    }

    //success

    redirect('/auth/password-recovery/recover/success');


}

export const setPasswordRecoveryAttemptCookie = async (passwordRecoveryAttempt: PasswordRecoveryAttempt) => {
    'use server';
    const cookieStore = await cookies();
    const data = encrypt(JSON.stringify(passwordRecoveryAttempt), config.encryption_secret);
    cookieStore.set(PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME, data, {
        httpOnly: true,
        maxAge: 1000 * 60 * 10 //10 minutes
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

export const deyAttemptCookie = async () => {
    'use server';
    const cookieStore = await cookies();
    cookieStore.set(PASSWORD_RECOVERY_ATTEMPT_COOKIE_NAME, '', {
        httpOnly: true,
        maxAge: 0
    });
}


export default PasswordRecoveryAction;