'use server'

import { ActionReturn } from "@/modules/auth/auth.types";
import { Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { updateMediaSchema } from "../schemas/media-shemas";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import mediaService from "../media.service";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";

export const updateMediaAction = async (
    id: number,
    formData: FormData
): Promise<ActionReturn<UpdateMediaInput, Media>> => {
    // Extract values from FormData
    const rawData: UpdateMediaInput = {
        title: formData.get('title') as string | undefined,
        description: formData.get('description') as string | undefined,
        seo_alt: formData.get('seo_alt') as string | undefined,
        seo_title: formData.get('seo_title') as string | undefined,
        seo_description: formData.get('seo_description') as string | undefined,
        seo_filename: formData.get('seo_filename') as string | undefined,
    };

    // Trim string values
    trimValues(rawData, {
        deep: true
    });

    // Validate using schema
    const validated = updateMediaSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            errors: [],
            inputErrors: getObjErrorFromZod(validated.error),
            data: null,
            inputs: rawData
        };
    }

    // Clean undefined/null values and convert null to undefined
    const cleanedData: UpdateMediaInput = {};
    Object.entries(validated.data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            cleanedData[key as keyof UpdateMediaInput] = value as any;
        }
    });
    cleanObj(cleanedData);

    // Check if there's any data to update
    if (!Object.keys(cleanedData).length) {
        return {
            errors: [],
            inputErrors: { _form: 'No fields to update' },
            data: null,
            inputs: rawData
        };
    }

    // Update media
    const media = await mediaService.update(id, cleanedData);

    if (media.data) {
        return {
            data: media.data,
            errors: null,
            inputErrors: undefined
        };
    }

    return {
        data: null,
        errors: getFriendlyApiErrors(media)
    };
}
