'use server'

import { ActionReturn } from "@/modules/auth/auth.types";
import { Portfolio, CreatePortfolioInputWithFile } from "@repo/common-lib/types/portfolio";
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { MimeTypes } from "@repo/common-lib/types/general";
import portfolioService from "../portfolio.service";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";
import { createPortfolioSchema } from "../schemas/portfolio-schemas";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const createPortfolioAction = async (formData: FormData): Promise<ActionReturn<{
    title?: string,
    slug?: string,
    description?: string,
    thumbnail?: File
}, Portfolio>> => {
    const thumbnailFile = formData.get('thumbnail') as File | null;
    
    if (!thumbnailFile || thumbnailFile.size === 0) {
        return {
            errors: [],
            inputErrors: { thumbnail: 'Thumbnail is required' },
            data: null,
        };
    }

    if (thumbnailFile.size > MAX_FILE_SIZE) {
        return {
            errors: [],
            inputErrors: { thumbnail: 'Thumbnail file size must be less than 10MB' },
            data: null,
        };
    }

    if (!ALLOWED_IMAGE_FILE_TYPES.includes(thumbnailFile.type as MimeTypes)) {
        return {
            errors: [],
            inputErrors: { thumbnail: 'Thumbnail must be an image (JPEG, PNG or WebP)' },
            data: null,
        };
    }

    const rawData: CreatePortfolioInputWithFile = {
        title: formData.get('title') as string,
        slug: formData.get('slug') as string,
        description: formData.get('description') as string || undefined,
        user_id: parseInt(formData.get('user_id') as string),
        thumbnail: thumbnailFile,
    };

    trimValues(rawData, { deep: true });

    const validated = createPortfolioSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            errors: [],
            inputErrors: getObjErrorFromZod(validated.error),
            data: null,
        };
    }

    cleanObj(rawData);

    const portfolio = await portfolioService.create(rawData);

    if (portfolio.data) {
        return {
            data: portfolio.data,
            errors: null,
            inputErrors: undefined,
        };
    }

    return {
        data: null,
        errors: getFriendlyApiErrors(portfolio),
    };
};
