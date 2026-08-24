"use server";

import type { ActionReturn, Pagination } from "@repo/common-lib/types/response";
import type {
  UserNotification,
  UserNotificationIndexRequest,
} from "@repo/common-lib/types/user-notification";
import {
  getFriendlyApiErrors,
  requireSession,
  unauthorizedActionReturn,
} from "@/modules/auth/helpers";
import userNotificationsService from "../user-notifications.service";

export const getAllUserNotificationsAction = async (
  params?: UserNotificationIndexRequest,
): Promise<ActionReturn<UserNotification[], { pagination?: Pagination }>> => {
  const session = await requireSession();
  if (!session) {
    return await unauthorizedActionReturn<
      UserNotification[],
      { pagination?: Pagination }
    >();
  }

  const result = await userNotificationsService.getAll(session.id, {
    page: 1,
    paginated: true,
    ...params,
  });

  if (result.data) {
    return {
      data: result.data,
      errors: null,
      inputs: { pagination: result.pagination },
    };
  }
  return {
    data: null,
    errors: await getFriendlyApiErrors(result),
  };
};
