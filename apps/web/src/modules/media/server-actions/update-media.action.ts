'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import { Media, UpdateMediaInput } from "@repo/common-lib/types/media";
import { updateMediaSchema } from "../schemas/media-shemas";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import mediaService from "../media.service";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";

export const updateMediaAction = async (
    id: number,
    input: UpdateMediaInput
): Promise<ActionReturn<Media, UpdateMediaInput>> => {
    // Trim string values
    trimValues(input, {
        deep: true
    });

    // Validate using schema
    const validated = updateMediaSchema.safeParse(input);

    if (!validated.success) {
        return {
            errors: [],
            inputErrors: getObjErrorFromZod(validated.error),
            data: null,
            inputs: input
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
            inputs: input
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
