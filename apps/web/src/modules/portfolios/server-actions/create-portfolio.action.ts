'use server'

import { ActionReturn } from "@repo/common-lib/types/response";
import { Portfolio, CreatePortfolioInputWithFile } from "@repo/common-lib/types/portfolio";
import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { MimeTypes } from "@repo/common-lib/types/general";
import portfolioService from "../portfolio.service";
import { getFriendlyApiErrors, getObjErrorFromZod } from "@/modules/auth/helpers";
import { createPortfolioSchema } from "../schemas/portfolio-schemas";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const createPortfolioAction = async (
    input: CreatePortfolioInputWithFile
): Promise<ActionReturn<Portfolio, Partial<CreatePortfolioInputWithFile>>> => {
    console.log("INPUT",input)
    const thumbnailFile = input?.thumbnail as File | undefined;

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

    // Copy to avoid mutating the caller object (trim/clean mutate in-place).
    const rawData: CreatePortfolioInputWithFile = {
        ...input,
        thumbnail: thumbnailFile,
        description: input.description || undefined,
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

    if (rawData.slug) {
        const slugExistsResponse = await portfolioService.slugExists(rawData.user_id, rawData.slug);

        if (slugExistsResponse.error) {
            return {
                data: null,
                errors: getFriendlyApiErrors(slugExistsResponse),
            };
        }

        if (slugExistsResponse.data?.exists) {
            return {
                data: null,
                errors: [],
                inputErrors: { slug: 'Slug already exists' },
            };
        }
    }

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
