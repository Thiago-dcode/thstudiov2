'use server';

import { cookies, headers } from "next/headers";
import authService from "../auth.service";
import { verify2faRequestSchema } from "../schemas/auth.shema";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { redirect } from "next/navigation";
import { TWO_FA_COOKIE_NAME, TOKEN_COOKIE_NAME } from "@repo/common-lib/constants";

export const verify2faServerAction = async (formData: FormData) => {

    const credentials = {
        email: formData.get('email') ? formData.get('email') as string : undefined,
        twofa_code: formData.get('twofa_code') ? formData.get('twofa_code') as string : undefined,
    }
    const validatedData = verify2faRequestSchema.safeParse(credentials);
    if (!validatedData.success) {
        const errors = Object.values(validatedData.error.flatten().fieldErrors).map((value) => {
            return value
        }).flat();
        const url = queryParamBuilder('/login', { errors});
        redirect(url);
    }
    const nextHeaders = await headers();
    const user_agent = nextHeaders.get('user-agent') ?? undefined;
    const ip_address = nextHeaders.get('x-forwarded-for') ?? undefined;
    const result = await authService.verify2fa({
        email: validatedData.data.email,
        twofa_code: validatedData.data.twofa_code,
        user_agent,
        ip_address,
    });
    if (result.error || result.data === null) {
        if (result.error && result.error.status_code === 400) {
            redirect('/auth/2fa?errors[]=Invalid twofa code');
        }
        redirect('/auth/2fa?errors[]=Something went wrong');
    }
    const cookieStore = await cookies();
    //Success
    cookieStore.delete(TWO_FA_COOKIE_NAME);
    cookieStore.set(TOKEN_COOKIE_NAME, JSON.stringify(result.data), {
        httpOnly: true,
        sameSite: true,
        secure: true,
        maxAge: 60 * 60 * 24 //1 day
    });
    redirect('/');
}
