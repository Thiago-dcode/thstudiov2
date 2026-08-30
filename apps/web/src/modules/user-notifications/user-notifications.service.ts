import type { ApiResponse } from "@repo/common-lib/types/response";
import type {
  UserNotification,
  UserNotificationIndexRequest,
} from "@repo/common-lib/types/user-notification";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

export class UserNotificationsService extends BaseService {
  constructor() {
    super(fetchApi(), "users");
  }

  async getAll(
    user_id: number,
    filters?: UserNotificationIndexRequest,
  ): Promise<ApiResponse<UserNotification[]>> {
    return await this.fetchApi.get({
      resource: queryParamBuilder(`${user_id}/notifications`, filters),
      cacheOptions: {
        cache: "no-store",
      },
    });
  }

  async getOne(
    id: number,
    user_id: number,
  ): Promise<ApiResponse<UserNotification>> {
    return await this.fetchApi.get({
      resource: `${user_id}/notifications/${id}`,
    });
  }

  /** No body: the API stamps `read_at` itself and returns the notification as it now stands. */
  async markAsRead(
    id: number,
    user_id: number,
  ): Promise<ApiResponse<UserNotification>> {
    return await this.fetchApi.patch({
      resource: `${user_id}/notifications/${id}/read`,
    });
  }

  /**
   * Marks an explicit list as read in one round trip. Returns those notifications as they now
   * stand, so the caller can write them back without a refetch.
   */
  async markManyAsRead(
    ids: number[],
    user_id: number,
  ): Promise<ApiResponse<UserNotification[]>> {
    return await this.fetchApi.patch({
      resource: `${user_id}/notifications/read`,
      body: { ids },
    });
  }
}

let UserNotificationsServiceInstance: UserNotificationsService | null = null;

export default (() => {
  if (!UserNotificationsServiceInstance) {
    UserNotificationsServiceInstance = new UserNotificationsService();
  }
  return UserNotificationsServiceInstance;
})();
