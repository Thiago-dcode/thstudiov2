'use server';

import { cookies } from "next/headers";
import { TOKEN_COOKIE_NAME } from "@repo/common-lib/constants";
import { UserAuth } from "../auth.types";

export const userSession = async () => {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if(!cookieValue){
        return null;
    }
    const userAuth = JSON.parse(cookieValue) as UserAuth;
    if(!userAuth?.token || !userAuth?.id){
        return null;
    }
    return userAuth;
}
