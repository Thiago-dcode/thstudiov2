'use server';

import { registerRequestSchema } from "../schemas/auth.shema";
import { set2faCookie, delete2faCookie } from "./twofa.action";
import { ActionReturn } from "@repo/common-lib/types/response";
import authService from "../auth.service";
import { BaseUser } from "@repo/common-lib/types/user";
import { getObjErrorFromZod } from "../helpers";

export const registerServerAction = async (formData: FormData): Promise<ActionReturn<BaseUser, {
    email?: string,
    username?: string
}>> => {
    // Clean up any existing 2FA cookie from previous login attempts
    await delete2faCookie();
    const credentials = {
        email: formData.get('email') ? formData.get('email') as string : undefined,
        username: formData.get('username') ? formData.get('username') as string : undefined,
        password: formData.get('password') ? formData.get('password') as string : undefined,
        invitation_code: formData.get('invitation_code') ? formData.get('invitation_code') as string : undefined,
    }
    const validatedData = registerRequestSchema.safeParse(credentials);
    if (!validatedData.success) {
        return {
            data: null,
            errors: [],
            inputErrors: getObjErrorFromZod(validatedData.error),
            inputs: credentials
        }
    }
    const result = await authService.register(validatedData.data);
    if (result.error || result.data === null) {
        let errors = result.error && (result.error.status_code === 400 || result.error.status_code === 401) ? result.error.errors : ['Something went wrong'];
        return {
            data: null,
            errors,
            inputs: credentials
        }

    }
    //Success
    await set2faCookie({ ...result.data, is_new: true });
    return {
        data: result.data,
        errors: null,
        inputs: credentials
    }
}



