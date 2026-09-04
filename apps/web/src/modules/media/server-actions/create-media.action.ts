"use server";

import type { EnumType } from "@repo/common-lib/constants/enums";
import {
  ALLOWED_FILE_TYPES,
  MAX_IMAGE_UPLOAD_MB,
  MAX_VIDEO_UPLOAD_MB,
} from "@repo/common-lib/constants/limits";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type {
  CreateMediaInputWithFile,
  Media,
} from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { MediaHelper } from "@repo/common-lib/utils/media";
import { revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
} from "@/modules/auth/helpers";
import mediaService from "../media.service";
import { createMediaSchema } from "../schemas/media-shemas";

export const createMediaAction = async (
  input: CreateMediaInputWithFile,
): Promise<ActionReturn<Media, CreateMediaInputWithFile>> => {
  const t = await getTranslations();

  // Validate file
  if (!input.file || input.file.size === 0) {
    return {
      errors: [],
      inputErrors: {
        file: t("validation.required", { field: t("fields.file") }),
      },
      data: null,
      inputs: input,
    };
  }

  // Per-type cap: video is allowed to be far larger than an image, so a single constant would
  // either reject legitimate video or wave through a 300MB PNG.
  if (!MediaHelper.allowedFileSize(input.file)) {
    return {
      errors: [],
      inputErrors: {
        file: t("validation.file.tooLarge", {
          field: t("fields.file"),
          mb:
            MediaHelper.getMediaTypeFromMimeType(input.file.type) === "VIDEO"
              ? MAX_VIDEO_UPLOAD_MB
              : MAX_IMAGE_UPLOAD_MB,
        }),
      },
      data: null,
      inputs: input,
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(input.file.type as MimeTypes)) {
    return {
      errors: [],
      inputErrors: {
        file: t("validation.file.invalidType", { field: t("fields.file") }),
      },
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
    description: validated.data.description ?? "",
    title: validated.data.title ?? "",
    seo_alt: validated.data.seo_alt ?? "",
    seo_title: validated.data.seo_title ?? "",
    seo_description: validated.data.seo_description ?? "",
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
    errors: await getFriendlyApiErrors(media),
  };
};
