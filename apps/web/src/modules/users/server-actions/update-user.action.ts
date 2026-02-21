'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import { updateUserSchema } from "../schemas/user-shemas";
import { BaseUser, UpdateUserInputWithAssets } from "@repo/common-lib/types/user";
import usersService from "../users.service";
import { trimValues } from "@repo/common-lib/utils/cleanObj";
import { MimeTypes } from "@repo/common-lib/types/general";
import { revalidateTag } from "next/cache";
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export const updateUserAction = async (id: number, formData: FormData): Promise<ActionReturn<BaseUser, UpdateUserInputWithAssets>> => {

    const categories = formData.get('categories') as string;
    // Extract text fields from FormData
    let rawData: UpdateUserInputWithAssets = {
        name: formData.get('name') as string || undefined,
        surname: formData.get('surname') as string || undefined,
        profession: formData.get('profession') as string || undefined,
        username: formData.get('username') as string || undefined,
        short_biography: formData.get('short_biography') as string || undefined,
        funnel_step: formData.get('funnel_step') ? parseInt(formData.get('funnel_step') as string) : undefined,
        biography: formData.get('biography') as string || undefined,
        email: formData.get('email') as string || undefined,
        categories: categories ? categories.split(',') : undefined,
    };
    trimValues(rawData, { deep: true });

    // Remove empty/null values
    const cleanData = Object.fromEntries(
        Object.entries(rawData).filter(([_, value]) => !!value)
    );

    // Validate text fields
    const validated = updateUserSchema.safeParse(cleanData);
    if (!validated.success) {
        return {
            errors: [],
            inputErrors: getObjErrorFromZod(validated.error),
            data: null,
            inputs: rawData,
        };
    }

    // Validate avatar file if provided
    const avatarFile = formData.get('avatar') as File | null;
    if (avatarFile && avatarFile.size > 0) {
        if (avatarFile.size > MAX_FILE_SIZE) {
            return {
                errors: [],
                inputErrors: { avatar: 'Avatar file size must be less than 8MB' },
                data: null,
                inputs: rawData,
            };
        }
        if (!ALLOWED_IMAGE_FILE_TYPES.includes(avatarFile.type as MimeTypes)) {
            return {
                errors: [],
                inputErrors: { avatar: 'Avatar must be an image (JPEG, PNG or WebP)' },
                data: null,
                inputs: rawData,
            };
        }
        cleanData.avatar = avatarFile;
    }

    // Validate banner file if provided
    const bannerFile = formData.get('banner') as File | null;
    if (bannerFile && bannerFile.size > 0) {
        if (bannerFile.size > MAX_FILE_SIZE) {
            return {
                errors: [],
                inputErrors: { banner: 'Banner file size must be less than 8MB' },
                data: null,
                inputs: rawData,
            };
        }
        if (!ALLOWED_IMAGE_FILE_TYPES.includes(bannerFile.type as MimeTypes)) {
            return {
                errors: [],
                inputErrors: { banner: 'Banner must be an image (JPEG, PNG or WebP)' },
                data: null,
                inputs: rawData,
            };
        }
        cleanData.banner = bannerFile;
    }

    const result = await usersService.update(id, cleanData);

    if (result.error) {
        return {
            errors: getFriendlyApiErrors(result),
            data: null,
            inputs: rawData,
        };
    }

    revalidateTag(`user-${id}`, 'max');
    return {
        data: result.data!,
        errors: null,
        inputErrors: undefined,
        inputs: rawData,
    };
};
