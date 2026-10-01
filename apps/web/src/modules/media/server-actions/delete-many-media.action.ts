"use server";

import type {
  DeleteManyMediaInput,
  DeleteManyMediaResult,
} from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import mediaService from "../media.service";
import { deleteManyMediaSchema } from "../schemas/media-shemas";

export const deleteManyMediaAction = async (
  mediaIds: number[],
): Promise<ActionReturn<DeleteManyMediaResult, DeleteManyMediaInput>> => {
  // Ownership of each id is checked against the media row on the API. This only
  // confirms the caller is signed in.
  const session = await requireSession();
  const inputs = { media: mediaIds };
  if (!session) {
    return await unauthorizedActionReturn<
      DeleteManyMediaResult,
      DeleteManyMediaInput
    >(inputs);
  }

  const ids = Array.isArray(mediaIds) ? [...new Set(mediaIds)] : mediaIds;
  const validated = deleteManyMediaSchema.safeParse({ media: ids });
  if (!validated.success) {
    const t = await getTranslations();
    const inputErrors = getObjErrorFromZod(validated.error);
    return {
      data: null,
      errors: inputErrors.media
        ? [inputErrors.media]
        : [t("actions.genericError")],
      inputErrors,
      inputs,
    };
  }

  const result = await mediaService.deleteMany(validated.data);
  if (result.error) {
    return {
      data: null,
      errors: await getFriendlyApiErrors(result),
      inputs,
    };
  }

  if (result.data.deleted.length) revalidateTag(`user-${session.id}`, "max");

  return {
    data: result.data,
    errors: null,
    inputErrors: undefined,
    inputs,
  };
};
