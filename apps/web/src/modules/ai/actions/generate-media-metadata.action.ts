"use server";

import type { GenerateMediaMetadataInput } from "@repo/common-lib/types/ai";
import type { Media } from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { revalidateTag } from "next/cache";
import {
  getFriendlyApiErrors,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import aiService from "../ai.service";

export const generateMediaMetadataAction = async (
  mediaId: number,
): Promise<ActionReturn<Media, GenerateMediaMetadataInput>> => {
  // Ownership of the id is checked against the media row on the API.
  const session = await requireSession();
  if (!session) {
    return await unauthorizedActionReturn<Media, GenerateMediaMetadataInput>();
  }

  const result = await aiService.generateMediaMetadata(mediaId);

  if (result.data) {
    // Generation spends AI credits, so the cached credit budget has to be refreshed too.
    revalidateTag(`user-${session.id}`, "max");
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
