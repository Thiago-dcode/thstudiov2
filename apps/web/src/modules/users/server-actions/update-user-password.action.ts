'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import { updateUserPasswordSchema } from "../schemas/user-shemas";
import { BaseUser, UpdateUserPasswordInput } from "@repo/common-lib/types/user";
import usersService from "../users.service";

export const updateUserPasswordAction = async (id: number, formData: FormData): Promise<ActionReturn<BaseUser, UpdateUserPasswordInput>> => {

    const rawData: UpdateUserPasswordInput = {
        old_password: formData.get('old_password') as string,
        new_password: formData.get('new_password') as string,
    };

    const validated = updateUserPasswordSchema.safeParse(rawData);

    if (!validated.success) {
        const errors = validated.error.issues.map((err) =>
            `${err.path.join('.')}: ${err.message}`
        );
        return {
            errors,
            data: null,
            inputs: rawData,
        };
    }

    const result = await usersService.updatePassword(id, validated.data);

    if (result.error) {
        const { status_code, errors } = result.error;
        return {
            errors: status_code === 422 || status_code === 420 ? errors : ['Something went wrong'],
            data: null,
            inputs: rawData,
        };
    }

    return {
        data: result.data!,
        errors: null,
        inputErrors: undefined,
        inputs: rawData,
    };
};
