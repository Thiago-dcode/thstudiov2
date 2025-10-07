'use server';

import { USER_AUTH_COOKIE_NAME } from "@repo/common-lib/constants";
import { UserAuth } from "../auth.types";
import { getConfigValue } from "@repo/common-lib/config/utils";
import { decrypt, encrypt } from "@repo/common-lib/utils/encrypt";
import { cookies } from "next/headers";

let secret: string;
const getSecret =  () => {
    if(!secret){
        secret = getConfigValue('encryption').secret;
    }
    return secret;
}
export const userSession = async () => {
    const cookieStore = await cookies();
    const secret =  getSecret();
    let cookieValue = cookieStore.get(USER_AUTH_COOKIE_NAME)?.value;
    cookieValue = cookieValue ? decrypt(cookieValue,secret) : undefined;
    if(!cookieValue){
        return null;
    }
    const userAuth = JSON.parse(cookieValue) as UserAuth;
    if(!userAuth?.token || !userAuth?.id){
        return null;
    }
    return userAuth;
}

export const setUserSession = async (userAuth: UserAuth) => {
    'use server';
    const cookieStore = await cookies();
    const secret = getSecret();
    cookieStore.set(USER_AUTH_COOKIE_NAME, encrypt(JSON.stringify(userAuth), secret), {
        httpOnly: true,
        sameSite: true,
        secure: true,
        maxAge: 60 * 60 * 24 //1 day
    });
}

export const deleteUserSession = async () => {
    'use server';
    const cookieStore = await cookies();
    cookieStore.delete(USER_AUTH_COOKIE_NAME);
}
