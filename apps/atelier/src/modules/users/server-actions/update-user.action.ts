'use server'

import { AuthActionReturn } from "@/modules/auth/auth.types";
import { updateUserSchema, UpdateUserSchemaType } from "../schemas/user-shemas";
import { BaseUser } from "@repo/common-lib/types/user";
import usersService from "../users.service";
import { trimValues } from "@repo/common-lib/utils/cleanObj";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const updateUserAction = async (id:number,formData: FormData): Promise<AuthActionReturn<UpdateUserSchemaType,BaseUser>> => {

      // Extract text fields from FormData
      let rawData = {
        name: formData.get('name') as string || undefined ,
        surname: formData.get('surname') as string || undefined ,
        username: formData.get('username') as string || undefined ,
        short_biography: formData.get('short_biography') as string || undefined ,
        funnel_step:formData.get('funnel_step')? parseInt(formData.get('funnel_step')as string) : undefined ,
        biography: formData.get('biography') as string || undefined ,
        email: formData.get('email') as string || undefined ,
    };
        trimValues(rawData,{
            deep:true
        })
    // Get current user session
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
        if (!ALLOWED_FILE_TYPES.includes(avatarFile.type)) {
            return {
                errors: ['Avatar must be an image (JPEG, PNG, WebP, or GIF)'],
                data:null ,
                inputs:rawData
            };
        }
    }
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

    //TODO: fetch user update
    const result = await usersService.update(id,validated.data);
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