"use server";

import type { ActionReturn } from "@repo/common-lib/types/response";
import type { UserMetrics } from "@repo/common-lib/types/user";
import { getFriendlyApiErrors } from "@/modules/auth/helpers";
import usersService from "../users.service";

export const getUserMetricsAction = async (
  id: number,
): Promise<ActionReturn<UserMetrics, undefined>> => {
  const metrics = await usersService.metrics(id);

  if (metrics.data) {
    return {
      data: metrics.data,
      errors: null,
      inputErrors: undefined,
    };
  }
  return {
    data: null,
    errors: await getFriendlyApiErrors(metrics),
  };
};
