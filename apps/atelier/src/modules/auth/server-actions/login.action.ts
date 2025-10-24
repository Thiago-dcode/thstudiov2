'use server';

import authService from "../auth.service";
import { loginRequestSchema } from "../schemas/auth.shema";
import { setRememberMe, setUserSession } from "./user-session.action";
import { set2faCookie, delete2faCookie } from "./twofa.action";
import { AuthActionReturn } from "../auth.types";

export const loginServerAction = async (formData: FormData):Promise<AuthActionReturn<{
        email?:string,
        rememberMe:boolean
    }>> => {
    // Clean up any existing 2FA cookie from previous login attempts
    await delete2faCookie();
    const credentials = {
        email: formData.get('email') ? formData.get('email') as string : undefined,
        password: formData.get('password') ? formData.get('password') as string : undefined,
        remember_me:!!formData.get('remember_me'),
    }
    const validatedData = loginRequestSchema.safeParse(credentials);
    if (!validatedData.success) {
        const errors = Object.values(validatedData.error.flatten().fieldErrors).map((value) => {
            return value
        }).flat();

        return {
            data:null,
            errors,
            inputs:{
                email:credentials.email,
                rememberMe: credentials.remember_me
            }
        }
    }
        const result = await authService.login({
            email: validatedData.data.email,
            password: validatedData.data.password,
        });
        if (result.error || result.data === null) {
            let errors =result.error && (result.error.status_code === 400 || result.error.status_code === 401)?  result.error.errors : ['Something went wrong'];
            return {
                data:null,
                errors,
                inputs:{
                    email:credentials.email,
                    rememberMe: credentials.remember_me
                }
            }
       
        }
        if(validatedData.data.remember_me){
            await setRememberMe();
        }
        //Success
        if(!result.data.token){
            await set2faCookie(result.data);
        }else{
            await setUserSession(result.data);
        }
        return {
            data:result.data,
            errors:null,
            inputs:{
                email:credentials.email,
                rememberMe: credentials.remember_me
            }
           }
        }
        