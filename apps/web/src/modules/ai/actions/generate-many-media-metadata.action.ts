"use server";

import { MAX_MEDIA_METADATA_BATCH } from "@repo/common-lib/constants/limits";
import type { GenerateManyMediaMetadataResult } from "@repo/common-lib/types/ai";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getTranslations } from "next-intl/server";
import * as z from "zod";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import aiService from "../ai.service";

const generateManyMediaMetadataSchema = z.object({
  media: z
    .array(z.number().int().positive())
    .min(1)
    .max(MAX_MEDIA_METADATA_BATCH),
});

export const generateManyMediaMetadataAction = async (
  mediaIds: number[],
): Promise<
  ActionReturn<GenerateManyMediaMetadataResult, { media: number[] }>
> => {
  const session = await requireSession();
  const inputs = { media: mediaIds };
  if (!session) {
    return await unauthorizedActionReturn<
      GenerateManyMediaMetadataResult,
      { media: number[] }
    >(inputs);
  }

  const ids = Array.isArray(mediaIds) ? [...new Set(mediaIds)] : mediaIds;
  const validated = generateManyMediaMetadataSchema.safeParse({ media: ids });
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

  const result = await aiService.generateManyMediaMetadata(
    validated.data.media,
  );
  if (result.error) {
    return {
      data: null,
      errors: await getFriendlyApiErrors(result),
      inputs,
    };
  }

  return {
    data: result.data,
    errors: null,
    inputErrors: undefined,
    inputs,
  };
};
