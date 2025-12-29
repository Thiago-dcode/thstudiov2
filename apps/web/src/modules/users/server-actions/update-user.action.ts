'use server'

import { ActionReturn } from "@/modules/auth/auth.types";
import { updateUserSchema } from "../schemas/user-shemas";
import { BaseUser, UpdateUserInputWithAssets } from "@repo/common-lib/types/user";
import usersService from "../users.service";
import { trimValues } from "@repo/common-lib/utils/cleanObj";
import { MimeTypes } from "@repo/common-lib/types/general";
import { revalidateTag } from "next/cache";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_FILE_TYPES:MimeTypes[] = ['image/jpeg', 'image/png', 'image/webp'];

export const updateUserAction = async (id:number,formData: FormData): Promise<ActionReturn<UpdateUserInputWithAssets,BaseUser>> => {

    const categories = formData.get('categories') as string;
      // Extract text fields from FormData
      let rawData:UpdateUserInputWithAssets = {
        name: formData.get('name') as string || undefined ,
        surname: formData.get('surname') as string || undefined ,
        profession: formData.get('profession') as string || undefined ,
        username: formData.get('username') as string || undefined ,
        short_biography: formData.get('short_biography') as string || undefined ,
        funnel_step:formData.get('funnel_step')? parseInt(formData.get('funnel_step')as string) : undefined ,
        biography: formData.get('biography') as string || undefined ,
        email: formData.get('email') as string || undefined ,
        categories: categories? categories.split(','): undefined 
    };
        trimValues(rawData,{
            deep:true
        })
 
    // Remove empty/null values
    const cleanData = Object.fromEntries(
        Object.entries(rawData).filter(([_, value]) => !!value)
    );
    // Validate text data
    const validated = updateUserSchema.safeParse(cleanData);

    if (!validated.success) {
        const errors = validated.error.issues.map((err) => 
            `${err.path.join('.')}: ${err.message}`
    );
        return {
            errors,
            data: null,
            inputs:validated.data
        };
    }
    const avatarFile = formData.get('avatar') as File | null;
    // Validate avatar file if provided
    if (avatarFile && avatarFile.size > 0) {
        if (avatarFile.size > MAX_FILE_SIZE) {
            return {
                errors: ['Avatar file size must be less than 5MB'],
                data:null ,
                inputs:rawData
            };
        }
        if (!ALLOWED_FILE_TYPES.includes(avatarFile.type as MimeTypes)) {
            return {
                errors: ['Avatar must be an image (JPEG, PNG or WebP)'],
                data:null ,
                inputs:rawData
            };
        }
        cleanData.avatar = avatarFile
    }
    const bannerFile = formData.get('banner') as File | null;
    // Validate banner file if provided
    if (bannerFile && bannerFile.size > 0) {
        if (bannerFile.size > MAX_FILE_SIZE) {
            return {
                errors: ['banner file size must be less than 5MB'],
                data:null ,
                inputs:rawData
            };
        }
        if (!ALLOWED_FILE_TYPES.includes(bannerFile.type as MimeTypes)) {
            return {
                errors: ['banner must be an image (JPEG, PNG or WebP)'],
                data:null ,
                inputs:rawData
            };
        }
        cleanData.banner = bannerFile
    }
    const result = await usersService.update(id,cleanData);
    revalidateTag(`user-${id}`,'max');
    if(result.error){
        const {status_code,errors} = result.error;
        return {
            errors: status_code === 422 || status_code ===420 ? errors: ['Something went wrong'],
            data:null,
            inputs:rawData
        }
    }
    return {

        data:result.data!,
        errors:null,
        inputs:rawData
    }


  
}