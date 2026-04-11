'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import { GetMediaSeoInput } from "@repo/common-lib/types/ai";
import aiService from "../ai.service";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import { Media } from "@repo/common-lib/types/media";

export const getMediaSeoAction = async (
    input: GetMediaSeoInput
): Promise<ActionReturn<Media, GetMediaSeoInput>> => {
    // Validate required fields
    if (!input.user_id || !input.media_id) {
        const inputErrors: Record<string, string> = {};
        if (!input.user_id) {
            inputErrors.user_id = 'User ID is required';
        }
        if (!input.media_id) {
            inputErrors.media_id = 'Media ID is required';
        }
        return {
            errors: ['user_id and media_id are required'],
            inputErrors,
            data: null,
            inputs: input
        };
    }

    // Call AI service
    const result = await aiService.getMediaSeo(input);

    if (result.data) {
        return {
            data: result.data,
            errors: null,
            inputErrors: undefined
        };
    }

    return {
        data: null,
        errors: getFriendlyApiErrors(result)
    };
}

