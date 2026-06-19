"use server";

import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import type { EnumType } from "@repo/common-lib/constants/enums";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type {
  CreateMediaInputWithFile,
  Media,
} from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { revalidateTag } from "next/cache";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
} from "@/modules/auth/helpers";
import mediaService from "../media.service";
import { createMediaSchema } from "../schemas/media-shemas";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const createMediaAction = async (
  input: CreateMediaInputWithFile,
): Promise<ActionReturn<Media, CreateMediaInputWithFile>> => {
  // Validate file

  if (!input.file || input.file.size === 0) {
    return {
      errors: [],
      inputErrors: { file: "File is required" },
      data: null,
      inputs: input,
    };
  }

  if (input.file.size > MAX_FILE_SIZE) {
    return {
      errors: [],
      inputErrors: { file: "File size must be less than 10MB" },
      data: null,
      inputs: input,
    };
  }

  if (!ALLOWED_IMAGE_FILE_TYPES.includes(input.file.type as MimeTypes)) {
    return {
      errors: [],
      inputErrors: { file: "File must be an image (JPEG, PNG or WebP)" },
      data: null,
      inputs: input,
    };
  }

  // Prepare data for validation (exclude file from schema validation)
  const { file, ...dataToValidate } = input;

  // Trim string values
  trimValues(dataToValidate, {
    deep: true,
  });

  // Validate using schema
  const validated = createMediaSchema.safeParse(dataToValidate);

  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
      inputs: input,
    };
  }

  // Clean undefined/null values
  cleanObj(dataToValidate);

  // Construct the final media data
  const mediaData: CreateMediaInputWithFile = {
    ...validated.data,
    compression_level: validated.data.compression_level as
      | EnumType<"COMPRESSION_LEVEL">
      | undefined,
    file: file,
    description: validated.data.description ?? undefined,
    title: validated.data.title ?? undefined,
    seo_alt: validated.data.seo_alt ?? undefined,
    seo_title: validated.data.seo_title ?? undefined,
    seo_description: validated.data.seo_description ?? undefined,
  };

  // Create media
  const media = await mediaService.create(mediaData);

  if (media.data) {
    // Revalidate any cached user-scoped data (matches `usersService` tag pattern)
    revalidateTag(`user-${mediaData.user_id}`, "max");
    return {
      data: media.data,
      errors: null,
      inputErrors: undefined,
    };
  }

  return {
    data: null,
    errors: getFriendlyApiErrors(media),
  };
};
