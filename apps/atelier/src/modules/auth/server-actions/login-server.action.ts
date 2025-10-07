'use server';

import { cookies, headers } from "next/headers";
import authService from "../auth.service";
import { loginRequestSchema } from "../schemas/auth.shema";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { redirect } from "next/navigation";
import { TWO_FA_COOKIE_NAME, TOKEN_COOKIE_NAME } from "@repo/common-lib/constants";

export const loginServerAction = async (formData: FormData) => {

    const credentials = {
        email: formData.get('email') ? formData.get('email') as string : undefined,
        password: formData.get('password') ? formData.get('password') as string : undefined,
    }
    const validatedData = loginRequestSchema.safeParse(credentials);
    if (!validatedData.success) {
        const errors = Object.values(validatedData.error.flatten().fieldErrors).map((value) => {
            return value
        }).flat();
        const url = queryParamBuilder('/auth/login', { errors, email: credentials.email });
        redirect(url);
    }
        const nextHeaders = await headers();
        const user_agent = nextHeaders.get('user-agent') ?? undefined;
        const ip_address = nextHeaders.get('x-forwarded-for') ?? undefined;
        const result = await authService.login({
            email: validatedData.data.email,
            password: validatedData.data.password,
            user_agent,
            ip_address,
        });
        if (result.error || !result.data) {
            if (result.error && result.error.status_code === 400) {
              redirect('/auth/login?errors[]=Invalid credentials&email=' + credentials.email);
            }
        redirect('/auth/login?errors[]=Something went wrong&email=' + credentials.email);
        }
        const cookieStore = await cookies();
        //Success
        if(result.data.token === null || result.data.twofa_code){
        
            cookieStore.set(TWO_FA_COOKIE_NAME,credentials.email as string, {
                httpOnly:true,
                sameSite:true,
                secure:true,
                maxAge:60 * 10 //10 minutes
            });
            redirect('/auth/2fa');
        }
        cookieStore.set(TOKEN_COOKIE_NAME, JSON.stringify(result.data), {
            httpOnly:true,
            sameSite:true,
            secure:true,
            maxAge:60 * 60 * 24 //1 day
        });
        redirect('/');
        }
        