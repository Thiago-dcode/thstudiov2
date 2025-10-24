'use server';

import { cookies } from "next/headers";
import authService from "../auth.service";
import { verify2faRequestSchema } from "../schemas/auth.shema";
import { TWO_FA_COOKIE_NAME } from "@repo/common-lib/constants";
import { getConfigValue } from "@repo/common-lib/config/utils";
import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { setUserSession } from "./user-session.action";
import { AuthActionReturn, UserAuth } from "../auth.types";
import { BaseUser } from "@/modules/users/schemas/users.types";

export const verify2faServerAction = async (formData: FormData):Promise<AuthActionReturn<{
    email?:string,
    twofa_code?:string,
},UserAuth>> => {
    const credentials = {
        email: formData.get('email') ? formData.get('email') as string : undefined,
        twofa_code: formData.get('twofa_code') ? formData.get('twofa_code') as string : undefined,
    }
    const validatedData = verify2faRequestSchema.safeParse(credentials);
    if (!validatedData.success) {
        const errors = Object.values(validatedData.error.flatten().fieldErrors).map((value) => {
            return value
        }).flat();
      return {
        data:null,
        errors,
        inputs:{
            email: credentials.email,
            twofa_code: credentials.twofa_code,
        }
      }
    }
    const result = await authService.verify2fa({
        email: validatedData.data.email,
        twofa_code: validatedData.data.twofa_code,
    });
    if (result.error || result.data === null) {

        return {
            data:null,
            errors:result.error && result.error.status_code === 400? [result.error?.errors.join(',')] : ['Something went wrong'],
            inputs:{
                email: credentials.email,
                twofa_code: credentials.twofa_code,
            }
            } ;
    }
    //Success
    await Promise.all([
        delete2faCookie(),
        setUserSession(result.data)
    ]);
    return {
        data:result.data,
        errors:null,
        inputs:{
            email: credentials.email,
            twofa_code: credentials.twofa_code,
        }
    }
}
export const get2faCookieData = async ():Promise<BaseUser|null> => {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(TWO_FA_COOKIE_NAME)?.value;
    if (!cookieValue) {
        return null;
    }
 try {
    const decrypted= decrypt(cookieValue, getConfigValue('encryption').secret);
    if(!decrypted) return null;
    return JSON.parse(decrypted) as BaseUser;
 } catch (error) {
    console.log(error);
    return null;
 }
}

export const delete2faCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.set(TWO_FA_COOKIE_NAME, '', {
        httpOnly: true,
        maxAge: 0
    });
}

export const set2faCookie = async (user: BaseUser) => {
    const cookieStore = await cookies();
    cookieStore.set(TWO_FA_COOKIE_NAME, encrypt(JSON.stringify(user), getConfigValue('encryption').secret), {
        httpOnly: true,
        maxAge: 60 * 10 //10 minutes
    });
}