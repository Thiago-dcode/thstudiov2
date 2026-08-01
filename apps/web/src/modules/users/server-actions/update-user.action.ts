"use server";

import { ALLOWED_IMAGE_FILE_TYPES } from "@repo/common-lib/constants/constants";
import type { MimeTypes } from "@repo/common-lib/types/general";
import type { ActionReturn } from "@repo/common-lib/types/response";
import type {
  BaseUser,
  UpdateUserInputWithAssets,
} from "@repo/common-lib/types/user";
import { cleanObj, trimValues } from "@repo/common-lib/utils/cleanObj";
import { revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
  isSessionOwner,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import { updateUserSchema } from "../schemas/user-shemas";
import usersService from "../users.service";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export const updateUserAction = async (
  id: number,
  formData: FormData,
): Promise<ActionReturn<BaseUser, UpdateUserInputWithAssets>> => {
  const session = await requireSession();
  if (!isSessionOwner(session, id)) {
    return await unauthorizedActionReturn<
      BaseUser,
      UpdateUserInputWithAssets
    >();
  }

  const categories = formData.get("categories") as string;
  // Extract text fields from FormData
  const rawData: UpdateUserInputWithAssets = {
    name: (formData.get("name") as string) ?? undefined,
    surname: (formData.get("surname") as string) ?? undefined,
    profession: (formData.get("profession") as string) ?? undefined,
    username: (formData.get("username") as string) ?? undefined,
    short_biography: (formData.get("short_biography") as string) ?? undefined,
    funnel_step: formData.get("funnel_step")
      ? parseInt(formData.get("funnel_step") as string, 10)
      : undefined,
    biography: (formData.get("biography") as string) ?? undefined,
    email: (formData.get("email") as string) ?? undefined,
    phone_number: (formData.get("phone_number") as string) ?? undefined,
    facebook_link: (formData.get("facebook_link") as string) ?? undefined,
    website_link: (formData.get("website_link") as string) ?? undefined,
    instagram_link: (formData.get("instagram_link") as string) ?? undefined,
    youtube_link: (formData.get("youtube_link") as string) ?? undefined,
    categories: categories ? categories.split(",") : undefined,
  };
  trimValues(rawData, { deep: true });

  const cleanData: UpdateUserInputWithAssets = { ...rawData };
  cleanObj(cleanData);

  // Validate text fields
  const t = await getTranslations();
  const validated = updateUserSchema(t).safeParse(cleanData);

  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
      inputs: rawData,
    };
  }

  // Validate avatar file if provided
  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > MAX_FILE_SIZE) {
      return {
        errors: [],
        inputErrors: {
          avatar: t("validation.file.tooLarge", {
            field: t("fields.avatar"),
            mb: 8,
          }),
        },
        data: null,
        inputs: rawData,
      };
    }
    if (!ALLOWED_IMAGE_FILE_TYPES.includes(avatarFile.type as MimeTypes)) {
      return {
        errors: [],
        inputErrors: {
          avatar: t("validation.file.invalidType", {
            field: t("fields.avatar"),
          }),
        },
        data: null,
        inputs: rawData,
      };
    }
    cleanData.avatar = avatarFile;
  }

  // Validate banner file if provided
  const bannerFile = formData.get("banner") as File | null;
  if (bannerFile && bannerFile.size > 0) {
    if (bannerFile.size > MAX_FILE_SIZE) {
      return {
        errors: [],
        inputErrors: {
          banner: t("validation.file.tooLarge", {
            field: t("fields.banner"),
            mb: 8,
          }),
        },
        data: null,
        inputs: rawData,
      };
    }
    if (!ALLOWED_IMAGE_FILE_TYPES.includes(bannerFile.type as MimeTypes)) {
      return {
        errors: [],
        inputErrors: {
          banner: t("validation.file.invalidType", {
            field: t("fields.banner"),
          }),
        },
        data: null,
        inputs: rawData,
      };
    }
    cleanData.banner = bannerFile;
  }

  const result = await usersService.update(id, cleanData);

  if (result.error) {
    return {
      errors: await getFriendlyApiErrors(result),
      data: null,
      inputs: rawData,
    };
  }

  revalidateTag(`user-${id}`, "max");
  return {
    data: result.data!,
    errors: null,
    inputErrors: undefined,
    inputs: rawData,
  };
};
