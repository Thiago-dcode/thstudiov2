"use server";

import type {
  Media,
  UpdateMediaLocationsInput,
} from "@repo/common-lib/types/media";
import type { ActionReturn } from "@repo/common-lib/types/response";
import { trimValues } from "@repo/common-lib/utils/cleanObj";
import { revalidateTag } from "next/cache";
import {
  getFriendlyApiErrors,
  getObjErrorFromZod,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import mediaService from "../media.service";
import { updateMediaLocationsSchema } from "../schemas/media-shemas";

export const updateMediaLocationsAction = async (
  input: UpdateMediaLocationsInput,
): Promise<ActionReturn<Media[], UpdateMediaLocationsInput>> => {
  // Ownership of each id is checked against the media row on the API. This only
  // confirms the caller is signed in.
  const session = await requireSession();
  if (!session) {
    return await unauthorizedActionReturn<Media[], UpdateMediaLocationsInput>(
      input,
    );
  }

  // `trimValues` mutates in place, and `location` is a nested object the caller still holds.
  const candidate = trimValues(
    {
      location: input.location && { ...input.location },
      media: Array.isArray(input.media)
        ? [...new Set(input.media)]
        : input.media,
    },
    { deep: true },
  );

  const validated = updateMediaLocationsSchema.safeParse(candidate);
  if (!validated.success) {
    return {
      errors: [],
      inputErrors: getObjErrorFromZod(validated.error),
      data: null,
      inputs: input,
    };
  }

  const result = await mediaService.updateLocations(validated.data);
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
