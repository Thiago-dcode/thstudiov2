"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type {
  ArtistCard,
  ArtistIndexRequest,
} from "@repo/common-lib/types/user";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import usersService from "../users.service";

export const findArtistsAction = async (
  params: ArtistIndexRequest,
): Promise<ActionReturn<ArtistCard[], undefined>> => {
  const result = await usersService.findAll(params);

  if (result.data) {
    return {
      data: result.data,
      errors: null,
    };
  }
  return {
    data: null,
    errors: getFriendlyApiErrors(result),
  };
};
