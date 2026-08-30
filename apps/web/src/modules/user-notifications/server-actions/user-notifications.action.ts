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

export const markUserNotificationAsReadAction = async (
  id: number,
): Promise<ActionReturn<UserNotification>> => {
  const session = await requireSession();
  if (!session) {
    return await unauthorizedActionReturn<UserNotification>();
  }

  const result = await userNotificationsService.markAsRead(id, session.id);

  if (result.data) {
    return { data: result.data, errors: null };
  }
  return {
    data: null,
    errors: await getFriendlyApiErrors(result),
  };
};

/**
 * Marks the given notifications as read for the session user. The ids come from what the client
 * has rendered, never a "mark everything" flag, and the API scopes the write to this user — so a
 * foreign id is a no-op rather than an error.
 */
export const markUserNotificationsAsReadAction = async (
  ids: number[],
): Promise<ActionReturn<UserNotification[]>> => {
  const session = await requireSession();
  if (!session) {
    return await unauthorizedActionReturn<UserNotification[]>();
  }

  // Nothing to mark is a success with nothing written, not a round trip the API has to reject.
  if (!ids.length) {
    return { data: [], errors: null };
  }

  const result = await userNotificationsService.markManyAsRead(ids, session.id);

  if (result.data) {
    return { data: result.data, errors: null };
  }
  return {
    data: null,
    errors: await getFriendlyApiErrors(result),
  };
};
