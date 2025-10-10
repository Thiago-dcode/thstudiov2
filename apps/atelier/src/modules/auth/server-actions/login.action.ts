'use server';

import authService from "../auth.service";
import { loginRequestSchema } from "../schemas/auth.shema";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { redirect } from "next/navigation";
import { setRememberMe, setUserSession } from "./user-session.action";
import { set2faCookie, delete2faCookie } from "./twofa.action";

export const loginServerAction = async (formData: FormData) => {
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
        const url = queryParamBuilder('/auth/login', { errors, email: credentials.email });
        redirect(url);
    }
        const result = await authService.login({
            email: validatedData.data.email,
            password: validatedData.data.password,
        });
        if (result.error || result.data === null) {
            if (result.error && (result.error.status_code === 400 || result.error.status_code === 401)) {
              redirect('/auth/login?errors[]=Invalid credentials&email=' + credentials.email);
            }
            console.log('result from loginServerAction', result);
        redirect('/auth/login?errors[]=Something went wrong&email=' + credentials.email);
        }
        if(validatedData.data.remember_me){
            await setRememberMe();
        }
        //Success
        if(result.data.token === null || result.data.twofa_code){
           await set2faCookie(credentials.email as string);
            redirect('/auth/2fa');
        }
        await setUserSession(result.data);
        redirect('/');
        }
        