'use server';

import { cookies } from "next/headers";
import authService from "../auth.service";
import { verify2faRequestSchema } from "../schemas/auth.shema";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { redirect } from "next/navigation";
import { TWO_FA_COOKIE_NAME } from "@repo/common-lib/constants";
import { getConfigValue } from "@repo/common-lib/config/utils";
import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { setUserSession } from "./user-session.action";

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
    const result = await authService.verify2fa({
        email: validatedData.data.email,
        twofa_code: validatedData.data.twofa_code,
    });
    if (result.error || result.data === null) {
        const errorMessage = result.error && result.error.status_code === 400?'Invalid twofa code':'Something went wrong';
        redirect('/auth/2fa?errors[]=' + errorMessage);
    }
    //Success
    await Promise.all([
        delete2faCookie(),
        setUserSession(result.data)
    ]);
    redirect('/atelier');
}
export const get2faCookieData = async () => {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(TWO_FA_COOKIE_NAME)?.value;
    if (!cookieValue) {
        return null;
    }
    return decrypt(cookieValue, getConfigValue('encryption').secret);
}

export const delete2faCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.set(TWO_FA_COOKIE_NAME, '', {
        httpOnly: true,
        maxAge: 0
    });
}

export const set2faCookie = async (value: string) => {
    const cookieStore = await cookies();
    cookieStore.set(TWO_FA_COOKIE_NAME, encrypt(value, getConfigValue('encryption').secret), {
        httpOnly: true,
        maxAge: 60 * 10 //10 minutes
    });
}