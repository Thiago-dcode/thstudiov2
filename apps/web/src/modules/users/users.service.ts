import type { AboutPage } from "@repo/common-lib/types/about-page";
import type { Address } from "@repo/common-lib/types/address";
import type { CategoryBase } from "@repo/common-lib/types/category";
import type {
  GetAllUserMediaQueryParams,
  Media,
} from "@repo/common-lib/types/media";
import type { FullPlan } from "@repo/common-lib/types/plan";
import type { FullPlanSubscription } from "@repo/common-lib/types/plan-subscription";
import type { ApiResponse } from "@repo/common-lib/types/response";
import type {
  ArtistCard,
  ArtistIndexRequest,
  BaseUser,
  CompactUser,
  UpdateUserInputWithAssets,
  UpdateUserPasswordInput,
  User,
  UserMetrics,
  UserProfile,
} from "@repo/common-lib/types/user";
import type { UserExtraData } from "@repo/common-lib/types/user-extra-data";
import { queryParamBuilder } from "@repo/common-lib/utils/query-builder";
import { fetchApi } from "@/lib/facade/fetchApi";
import { BaseService } from "@/lib/services/base.service";

export class UserService extends BaseService {
  constructor() {
    super(fetchApi(), "users");
  }

  async getOne(id: number): Promise<ApiResponse<User>> {
    return await this.fetchApi.get({
      resource: queryParamBuilder(`${id}`),
    });
  }
  async update(
    id: number,
    data: UpdateUserInputWithAssets,
  ): Promise<ApiResponse<BaseUser>> {
    return await this.fetchApi.patch({
      resource: `${id}`,
      body: data,
    });
  }
  async getAllCategories(id: number): Promise<ApiResponse<CategoryBase[]>> {
    return await this.fetchApi.get({
      resource: `${id}/categories`,
      cacheOptions: {
        cache: "force-cache",
        next: {
          tags: [`user-${id}`],
        },
      },
    });
  }

  async getAllMedia(
    id: number,
    params?: GetAllUserMediaQueryParams,
  ): Promise<ApiResponse<Media[]>> {
    return await this.fetchApi.get({
      resource: queryParamBuilder(`${id}/media`, params),
      cacheOptions: {
        cache: "no-cache",
      },
    });
  }
  async getAboutPage(username: string): Promise<ApiResponse<AboutPage>> {
    return await this.fetchApi.get({
      resource: `${username}/about-page`,
    });
  }
  async getExtraData(id: number): Promise<ApiResponse<UserExtraData>> {
    return await this.fetchApi.get({
      resource: `${id}/extra-data`,
    });
  }
  async getActivePlan(id: number): Promise<ApiResponse<FullPlan>> {
    return await this.fetchApi.get({
      resource: `${id}/plan`,
    });
  }
  async getActiveSubscription(
    userId: number,
  ): Promise<ApiResponse<FullPlanSubscription>> {
    return await this.fetchApi.get({ resource: `${userId}/subscription` });
  }
  async metrics(id: number): Promise<ApiResponse<UserMetrics>> {
    return await this.fetchApi.get({
      resource: `${id}/metrics`,
      cacheOptions: {
        cache: "default",
        next: {
          tags: [`subscription-${id}`, `user-${id}`],
        },
      },
    });
  }
  async updatePassword(
    id: number,
    data: UpdateUserPasswordInput,
  ): Promise<ApiResponse<BaseUser>> {
    return await this.fetchApi.post({
      resource: `${id}/password`,
      body: data,
    });
  }

  async getProfile(username: string): Promise<ApiResponse<UserProfile>> {
    return await this.fetchApi.get({
      resource: `profile/${username}`,
    });
  }
  async getCompact(username: string): Promise<ApiResponse<CompactUser>> {
    return await this.fetchApi.get({
      resource: `compact/${username}`,
    });
  }

  async usernameExists(username: string): Promise<ApiResponse<boolean>> {
    return await this.fetchApi.get({
      resource: `exists/${username}`,
    });
  }

  async address(id: number): Promise<ApiResponse<Address>> {
    return await this.fetchApi.get({
      resource: `${id}/address`,
      cacheOptions: {
        cache: "default",
        next: {
          tags: [`address-${id}`],
        },
      },
    });
  }

  async findAll(
    params: ArtistIndexRequest,
  ): Promise<ApiResponse<ArtistCard[]>> {
    return await this.fetchApi.get({
      resource: queryParamBuilder("", params),
    });
  }
}

let UserServiceInstance: UserService | null = null;

export default (() => {
  if (!UserServiceInstance) {
    UserServiceInstance = new UserService();
  }
  return UserServiceInstance;
})();
