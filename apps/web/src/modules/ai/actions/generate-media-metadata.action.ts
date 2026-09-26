"use server";

import type { GenerateMediaMetadataInput } from "@repo/common-lib/types/ai";
import type { Media } from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import aiService from "../ai.service";

export const generateMediaMetadataAction = async (
  mediaId: number,
): Promise<ActionReturn<Media, GenerateMediaMetadataInput>> => {
  const result = await aiService.generateMediaMetadata(mediaId);

  if (result.data) {
    return {
      data: result.data,
      errors: null,
      inputErrors: undefined,
    };
  }

  return {
    data: null,
    errors: await getFriendlyApiErrors(result),
  };
};
