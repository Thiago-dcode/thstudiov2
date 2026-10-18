"use server";

import type {
  Media,
  UpdateMediaCategoriesInput,
} from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { revalidateTag } from "next/cache";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import mediaService from "../media.service";
import { updateMediaCategoriesSchema } from "../schemas/media-shemas";

export const updateMediaCategoriesAction = async (
  input: UpdateMediaCategoriesInput,
): Promise<ActionReturn<Media[], UpdateMediaCategoriesInput>> => {
  // Ownership of each id is checked against the media row on the API. This only
  // confirms the caller is signed in.
  const session = await requireSession();
  if (!session) {
    return await unauthorizedActionReturn<Media[], UpdateMediaCategoriesInput>(
      input,
    );
  }

  const candidate = {
    category_ids: Array.isArray(input.category_ids)
      ? [...new Set(input.category_ids)]
      : input.category_ids,
    media: Array.isArray(input.media) ? [...new Set(input.media)] : input.media,
    replace: input.replace,
  };

  const validated = updateMediaCategoriesSchema.safeParse(candidate);
  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
      inputs: input,
    };
  }

  const result = await mediaService.updateCategories(validated.data);
  if (result.error) {
    return {
      data: null,
      errors: await getFriendlyApiErrors(result),
      inputs: input,
    };
  }

  revalidateTag(`user-${session.id}`, "max");

  return {
    data: result.data,
    errors: null,
    inputErrors: undefined,
    inputs: input,
  };
};
